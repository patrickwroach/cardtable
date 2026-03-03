// ---------------------------------------------------------------------------
// FEAT-007: Card Catalog & Deck Constraints
// ---------------------------------------------------------------------------

export interface CardDefinition {
  /** Unique identifier within a game definition */
  id: string;
  name: string;
  description?: string;
  /** Arbitrary metadata (effects, point value, etc.) stored as key-value pairs */
  metadata?: Record<string, string | number | boolean>;
}

export interface DeckRules {
  minCards: number;
  maxCards: number;
  /** Card IDs that must appear at least once in the deck */
  requiredCardIds: string[];
  /** Maximum allowed copies of a single card ID (0 = unlimited) */
  maxCopiesPerCard: number;
}

// ---------------------------------------------------------------------------
// FEAT-008: Turn/Phase Rules & Win Conditions
// ---------------------------------------------------------------------------

export interface PhaseTransition {
  /** ID of the target phase */
  toPhaseId: string;
  /** Human-readable condition description (runtime evaluates this) */
  condition: string;
}

export interface TurnPhase {
  id: string;
  name: string;
  transitions: PhaseTransition[];
}

export interface WinCondition {
  id: string;
  /** Human-readable condition evaluated by runtime (FEAT-008) */
  condition: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// FEAT-009: Import/Export & Schema Validation
// ---------------------------------------------------------------------------

/** Increment when the schema changes in a backwards-incompatible way */
export const CURRENT_SCHEMA_VERSION = 1;

export interface GameDefinition {
  id: string;
  creatorId: string;
  name: string;

  // FEAT-009
  schemaVersion: number;

  // FEAT-007
  cards: CardDefinition[];
  deckRules: DeckRules;

  // FEAT-008
  turnPhases: TurnPhase[];
  winConditions: WinCondition[];

  createdAt: number;
  updatedAt: number;
}
