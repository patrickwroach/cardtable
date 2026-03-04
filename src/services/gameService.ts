import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion,
  runTransaction,
} from 'firebase/firestore';
import type {Unsubscribe} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { GameState, Player, EndReason } from '../types/game';
import { createDeck, drawCards } from '../utils/deck';
import { getGameDefinition } from './gameDefinitionService';

// FEAT-003: renamed from 'games' → 'rooms' to match spec terminology
const ROOMS_COLLECTION = 'rooms';

export async function createGame(
  hostId: string,
  hostName: string,
  gameDefinitionId?: string
): Promise<string> {
  const gameId = doc(collection(db, ROOMS_COLLECTION)).id;
  const deck = createDeck();

  const initialPlayer: Player = {
    id: hostId,
    name: hostName,
    hand: [],
    joinedAt: Date.now()
  };

  const gameState: GameState = {
    id: gameId,
    hostId,
    players: { [hostId]: initialPlayer },
    deck,
    playedCards: [],
    status: 'waiting',
    createdAt: Date.now(),
    ...(gameDefinitionId ? { gameDefinitionId } : {})
  };

  await setDoc(doc(db, ROOMS_COLLECTION, gameId), gameState);
  return gameId;
}

export async function joinGame(gameId: string, playerId: string, playerName: string): Promise<void> {
  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    hand: [],
    joinedAt: Date.now()
  };
  
  await updateDoc(gameRef, {
    [`players.${playerId}`]: newPlayer
  });
}

// FEAT-003/004: host starts session — sets first activePlayerId, initialises turn/phase
export async function startGame(gameId: string): Promise<void> {
  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) throw new Error('Room not found');
  const data = snap.data() as GameState;
  const firstPlayer = Object.keys(data.players)[0];

  // Load first phase from game definition if one is attached (FEAT-004 Task 1.2)
  let firstPhase: string | undefined;
  if (data.gameDefinitionId) {
    const def = await getGameDefinition(data.gameDefinitionId);
    if (def && def.turnPhases.length > 0) {
      firstPhase = def.turnPhases[0].id;
    }
  }

  await updateDoc(gameRef, {
    status: 'playing',
    activePlayerId: firstPlayer,
    turn: 1,
    ...(firstPhase !== undefined ? { phase: firstPhase } : {}),
  });
}

export async function drawCardFromDeck(gameId: string, playerId: string, count: number = 1): Promise<void> {
  // FEAT-004 Task 3.2: guard — only the active player may draw
  await validateTurnAction(gameId, playerId);

  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const gameData = gameDoc.data() as GameState;
  const { drawnCards, remainingDeck } = drawCards(gameData.deck, count);
  
  const currentHand = gameData.players[playerId]?.hand || [];
  const updatedHand = [...currentHand, ...drawnCards];
  
  await updateDoc(gameRef, {
    deck: remainingDeck,
    [`players.${playerId}.hand`]: updatedHand
  });
}

export async function playCard(gameId: string, playerId: string, cardId: string): Promise<void> {
  // FEAT-004 Task 3.2: guard — only the active player may play a card
  await validateTurnAction(gameId, playerId);

  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const gameData = gameDoc.data() as GameState;
  const playerHand = gameData.players[playerId]?.hand || [];
  const cardIndex = playerHand.findIndex(card => card.id === cardId);
  
  if (cardIndex === -1) {
    throw new Error('Card not found in player hand');
  }
  
  const card = playerHand[cardIndex];
  const updatedHand = playerHand.filter((_, idx) => idx !== cardIndex);
  
  await updateDoc(gameRef, {
    [`players.${playerId}.hand`]: updatedHand,
    playedCards: arrayUnion({ ...card, faceUp: true })
  });
}

export function subscribeToGame(gameId: string, callback: (game: GameState) => void): Unsubscribe {
  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  return onSnapshot(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GameState);
    }
  });
}

// ---------------------------------------------------------------------------
// FEAT-003: Shareable link helpers
// ---------------------------------------------------------------------------

/** Generates a shareable URL that encodes the room ID as a ?join= query param. */
export function generateShareableLink(gameId: string): string {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '';
  return `${base}?join=${gameId}`;
}

/**
 * Join a room via a resolved shareable link.
 * Semantically distinct from joinGame (called from link flow, not manual input)
 * but functionally identical — the link already carries the room ID.
 */
export async function joinGameByLink(
  gameId: string,
  playerId: string,
  playerName: string
): Promise<void> {
  return joinGame(gameId, playerId, playerName);
}

// ---------------------------------------------------------------------------
// FEAT-004: Turn & Phase Orchestration
// ---------------------------------------------------------------------------

/**
 * Validates that `playerId` is the active player in a live session.
 * Throws an actionable Error if the check fails (FEAT-004 Task 3.1/3.3).
 * Called by drawCardFromDeck and playCard as a server-side guard.
 */
export async function validateTurnAction(
  gameId: string,
  playerId: string
): Promise<void> {
  const snap = await getDoc(doc(db, ROOMS_COLLECTION, gameId));
  if (!snap.exists()) throw new Error('Room not found');
  const data = snap.data() as GameState;
  if (data.status !== 'playing') throw new Error('The game is not in progress.');
  if (data.activePlayerId !== playerId) {
    const activePlayer = data.players[data.activePlayerId ?? ''];
    const name = activePlayer?.name ?? 'another player';
    throw new Error(`It is not your turn — waiting for ${name}.`);
  }
}

/**
 * Advances to the next player's turn in round-robin order and transitions
 * the phase according to the game definition's `turnPhases` config.
 * Only the current active player may call this.
 * Writes all changes atomically via a Firestore transaction (FEAT-004 Tasks 2.1–2.3).
 */
export async function advanceTurnOrPhase(
  gameId: string,
  playerId: string
): Promise<void> {
  const gameRef = doc(db, ROOMS_COLLECTION, gameId);

  // Read current state first so we can fetch the game definition outside the transaction
  const snap = await getDoc(gameRef);
  if (!snap.exists()) throw new Error('Room not found');
  const data = snap.data() as GameState;

  if (data.status !== 'playing') throw new Error('Session is not active.');
  if (data.activePlayerId !== playerId)
    throw new Error('Only the active player can advance the turn.');

  // Compute next player (round-robin)
  const playerIds = Object.keys(data.players);
  const currentIndex = playerIds.indexOf(data.activePlayerId ?? playerIds[0]);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  const nextPlayerId = playerIds[nextIndex];
  const wrappedAround = nextIndex === 0;

  // Compute next phase from game definition's turnPhases config (Task 2.2)
  let nextPhase: string | undefined = data.phase;
  let incrementTurn = wrappedAround; // default: new turn when all players have gone

  if (data.gameDefinitionId) {
    const def = await getGameDefinition(data.gameDefinitionId);
    if (def && def.turnPhases.length > 0) {
      const currentPhase = def.turnPhases.find((p) => p.id === data.phase);
      if (!currentPhase) {
        // Task 2.3: clear error on invalid phase (FEAT-004)
        throw new Error(
          `Phase "${data.phase}" not found in game definition — check your game configuration.`
        );
      }
      if (currentPhase.transitions.length === 0) {
        // No outgoing transitions: stay on this phase
        if (wrappedAround) incrementTurn = true;
      } else {
        // Take the first valid transition (simple MVP rule evaluation)
        const nextPhaseId = currentPhase.transitions[0].toPhaseId;
        const nextPhaseIndex = def.turnPhases.findIndex((p) => p.id === nextPhaseId);
        const currentPhaseIndex = def.turnPhases.findIndex((p) => p.id === currentPhase.id);
        // Detect phase-graph cycle: stepping back to an earlier phase = new turn
        if (nextPhaseIndex <= currentPhaseIndex) incrementTurn = true;
        nextPhase = nextPhaseId;
      }
    }
  }

  // Write atomically — re-validate active player inside transaction to prevent races
  await runTransaction(db, async (transaction) => {
    const freshSnap = await transaction.get(gameRef);
    if (!freshSnap.exists()) throw new Error('Room not found');
    const fresh = freshSnap.data() as GameState;
    if (fresh.activePlayerId !== playerId) {
      throw new Error('Turn has already been advanced — please refresh.');
    }
    transaction.update(gameRef, {
      activePlayerId: nextPlayerId,
      turn: incrementTurn ? (fresh.turn ?? 1) + 1 : (fresh.turn ?? 1),
      // Only write phase when it has a defined value — Firestore rejects undefined
      ...(nextPhase !== undefined ? { phase: nextPhase } : {}),
    });
  });
}

// ---------------------------------------------------------------------------
// FEAT-006: Session Completion & Host Controls
// ---------------------------------------------------------------------------

/**
 * Marks the session finished with a winner and end reason (FEAT-006).
 * Blocks further gameplay mutations via status === 'finished'.
 */
export async function completeSession(
  gameId: string,
  winner: string,
  endedBy: string
): Promise<void> {
  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  await updateDoc(gameRef, {
    status: 'finished',
    winner,
    endReason: 'win-condition' satisfies EndReason,
    endedBy,
  });
}

/**
 * Host force-ends a stalled session (FEAT-006 FR-3).
 * Sets status to 'aborted' so all clients see terminal state.
 */
export async function forceEndSession(
  gameId: string,
  hostId: string
): Promise<void> {
  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) throw new Error('Room not found');
  const data = snap.data() as GameState;
  if (data.hostId !== hostId) throw new Error('Only the host can force-end a session');
  await updateDoc(gameRef, {
    status: 'aborted',
    endReason: 'force-ended' satisfies EndReason,
    endedBy: hostId,
  });
}
