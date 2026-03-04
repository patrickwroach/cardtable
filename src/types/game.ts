export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

/**
 * Describes how a card interacts with game rules.
 * Phase/turn restrictions are matched against the active room state at play-time.
 */
export interface CardEffect {
  /** Human-readable description of what this card does when played */
  description?: string;
  /** Phase IDs during which this card may be played; undefined/empty = no restriction */
  allowedPhaseIds?: string[];
  /** Whether playing this card immediately ends the active player's turn */
  endsTurn?: boolean;
}

export interface Card {
  id: string;
  suit?: Suit;
  rank?: Rank;
  faceUp: boolean;
  /** Display title shown on the card face (not unique) */
  title?: string;
  /** Flavour or rules text printed on the card face */
  description?: string;
  /** Optional art URL for this card */
  imageUrl?: string;
  /** Rule interactions for this card (phase gating, turn effects, etc.) */
  effects?: CardEffect;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  joinedAt: number;
}

/** FEAT-006: How a session ended */
export type EndReason = 'win-condition' | 'force-ended' | 'abandoned';

export interface GameState {
  id: string;
  hostId: string;
  players: Record<string, Player>;
  deck: Card[];
  playedCards: Card[];

  // FEAT-004: Turn & phase orchestration
  turn?: number;          // 1-indexed turn counter
  activePlayerId?: string;
  phase?: string;         // Active phase ID from game definition

  // FEAT-003/006: Room lifecycle status
  status: 'waiting' | 'playing' | 'finished' | 'aborted';

  // FEAT-006: Session completion
  winner?: string;       // playerId of winner, if applicable
  endReason?: EndReason;
  endedBy?: string;      // playerId who triggered end (force-end or last action)

  createdAt: number;

  /** Reference to the GameDefinition used for this room (FEAT-007/008) */
  gameDefinitionId?: string;
}
