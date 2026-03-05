// ---------------------------------------------------------------------------
// FEAT-007: Card Catalog & Deck Constraints
// ---------------------------------------------------------------------------

export interface CardDefinition {
  /** Unique identifier within a game definition */
  id: string;
  name: string;
  description?: string;
  /** Card type / category (e.g. "standard", "action") — FEAT-007 */
  type?: string;
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
// FEAT-008: Zones
// ---------------------------------------------------------------------------

export interface ZoneDefinition {
  id: string;
  label: string;
  /** Who owns an instance of this zone */
  owner: 'global' | 'per-player' | 'per-team';
  /** Visibility of cards inside the zone */
  visibility: 'public' | 'private' | 'hidden';
  /** true = card position/sequence matters (library, deck); false = unordered set */
  ordered: boolean;
  /** false = cards here cannot be targeted by effects */
  interactable: boolean;
  /** false = zone is cleared between rounds/hands */
  persistent: boolean;
}

// ---------------------------------------------------------------------------
// FEAT-008: Resource Pools
// ---------------------------------------------------------------------------

export interface ResourcePoolDefinition {
  id: string;
  label: string;
  /** How the pool resets over time */
  scope: 'persistent' | 'round' | 'turn' | 'phase';
  initialValue: number;
  /** Floor — undefined = no minimum */
  min?: number;
  /** Ceiling — undefined = no maximum */
  max?: number;
  /** Whether the pool value can only increase, only decrease, or both */
  direction: 'up' | 'down' | 'bidirectional';
  /** Whether this pool can be consumed as a cost to play a card or activate an effect */
  spendable: boolean;
  /** Whether unspent value evaporates at scope boundary (e.g. mana) */
  expireUnspent: boolean;
  owner: 'player' | 'team' | 'global';
}

// ---------------------------------------------------------------------------
// FEAT-008: Card Costs
// ---------------------------------------------------------------------------

export interface CardCost {
  poolId: string;
  amount: number;
  costType: 'spend' | 'require' | 'sacrifice';
  /** Required when costType === 'sacrifice' — the zone cards are moved from */
  sacrificeFromZoneId?: string;
}

// ---------------------------------------------------------------------------
// FEAT-008: Card Instance State (runtime, not stored in definition)
// ---------------------------------------------------------------------------

export interface CardInstanceState {
  /** Exhausted this cycle; cannot activate abilities until untapped */
  tapped: boolean;
  /** Named numeric counters on this card instance (e.g. { loyalty: 3 }) */
  counters: Record<string, number>;
  /** ID of the card instance this is attached to (enchantment/equipment) */
  attachedToCardInstanceId?: string;
}

// ---------------------------------------------------------------------------
// FEAT-008: Turn/Phase Rules & Win Conditions
// ---------------------------------------------------------------------------

export interface PhaseTransitionCondition {
  /** Registered type key — e.g. "pool_threshold", "zone_empty", "turn_count" */
  type: string;
  poolId?: string;
  zoneId?: string;
  operator?: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
  value?: number;
}

export interface PhasePoolReplenishment {
  poolId: string;
  /** Numeric amount or 'full' to restore to max */
  amount: number | 'full';
}

export interface TurnPhase {
  id: string;
  label: string;
  /** Pools that auto-replenish when this phase starts */
  poolReplenishments: PhasePoolReplenishment[];
  /** Conditions that trigger advancement to the next phase */
  transitionConditions: PhaseTransitionCondition[];
  /** null = loop back to first phase */
  nextPhaseId: string | null;
}

export interface WinConditionTrigger {
  subject: 'self' | 'opponent' | 'any_player';
  poolId: string;
  operator: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
  value: number;
}

export interface WinCondition {
  id: string;
  description?: string;
  trigger: WinConditionTrigger;
  outcome: 'subject_loses' | 'subject_wins' | 'draw';
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

  /** Minimum number of players required to start a session (inclusive). */
  minPlayers?: number;
  /** Maximum number of players allowed in a room (inclusive). */
  maxPlayers?: number;

  // FEAT-007
  cards: CardDefinition[];
  deckRules: DeckRules;

  // FEAT-008: Zones and resource pools
  zones: ZoneDefinition[];
  resourcePools: ResourcePoolDefinition[];

  // FEAT-008: Phases and win conditions (extended model)
  turnPhases: TurnPhase[];
  winConditions: WinCondition[];

  createdAt: number;
  updatedAt: number;
}
