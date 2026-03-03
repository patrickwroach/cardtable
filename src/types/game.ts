export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  joinedAt: number;
}

export interface GameState {
  id: string;
  hostId: string;
  players: Record<string, Player>;
  deck: Card[];
  playedCards: Card[];
  currentTurn?: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  gameRules?: string; // For future: different game types
}
