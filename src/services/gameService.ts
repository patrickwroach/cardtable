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
import type { GameState, Player } from '../types/game';
import { createDeck, drawCards } from '../utils/deck';

const GAMES_COLLECTION = 'games';

export async function createGame(hostId: string, hostName: string): Promise<string> {
  const gameId = doc(collection(db, GAMES_COLLECTION)).id;
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
    createdAt: Date.now()
  };
  
  await setDoc(doc(db, GAMES_COLLECTION, gameId), gameState);
  return gameId;
}

export async function joinGame(gameId: string, playerId: string, playerName: string): Promise<void> {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
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

export async function startGame(gameId: string): Promise<void> {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
    status: 'playing'
  });
}

export async function drawCardFromDeck(gameId: string, playerId: string, count: number = 1): Promise<void> {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
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
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
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
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  
  return onSnapshot(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GameState);
    }
  });
}
