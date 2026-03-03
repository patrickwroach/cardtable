import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion,
} from 'firebase/firestore';
import type {Unsubscribe} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { GameState, Player, EndReason } from '../types/game';
import { createDeck, drawCards } from '../utils/deck';

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

// FEAT-003: host starts session — sets first activePlayerId from player list
export async function startGame(gameId: string): Promise<void> {
  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) throw new Error('Room not found');
  const data = snap.data() as GameState;
  const firstPlayer = Object.keys(data.players)[0];
  const gameRef2 = doc(db, ROOMS_COLLECTION, gameId);
  await updateDoc(gameRef2, {
    status: 'playing',
    activePlayerId: firstPlayer,
  });
}

export async function drawCardFromDeck(gameId: string, playerId: string, count: number = 1): Promise<void> {
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
// FEAT-004: Turn & Phase Orchestration
// ---------------------------------------------------------------------------

/**
 * Advances to the next player's turn in round-robin order and optionally
 * transitions to the given phase. Both changes broadcast to all subscribers.
 */
export async function advanceTurnOrPhase(
  gameId: string,
  nextPlayerId: string,
  nextPhase?: string
): Promise<void> {
  const gameRef = doc(db, ROOMS_COLLECTION, gameId);
  await updateDoc(gameRef, {
    activePlayerId: nextPlayerId,
    ...(nextPhase !== undefined ? { phase: nextPhase } : {}),
  });
}

/**
 * Returns true when it is the given player's turn and the room is playing.
 * Use client-side before allowing gameplay actions (FEAT-004 gating).
 */
export async function validateTurnAction(
  gameId: string,
  playerId: string
): Promise<boolean> {
  const snap = await getDoc(doc(db, ROOMS_COLLECTION, gameId));
  if (!snap.exists()) return false;
  const data = snap.data() as GameState;
  return data.status === 'playing' && data.activePlayerId === playerId;
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
