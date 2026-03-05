# Design: Rules and Win Conditions

## Technical Approach

This change extends the game definition with four interconnected concepts:
**zones**, **resource pools**, **card costs**, and **structured win/loss conditions**.
Turn phases remain a linear ordered sequence for v1 but reference pool and zone IDs
in their transition conditions. `validateRulesDefinition` checks referential integrity
across all four concepts before a save is permitted.

## Architecture Decisions

### Decision: Zones are arbitrary and creator-defined
No hardcoded zone names. Each game definition declares its own zone list.
The existing `deck`, `hand`, and `playedCards` fields on room state are legacy;
the zone model is the authoritative schema going forward.
Zones have behavioral properties (visibility, ordering, interactability) rather than
implied semantics from their name.

### Decision: Resource pools unify all numeric player state
Life, score, mana, poison counters, tricks-won, and bid-contract are all instances
of `ResourcePoolDefinition` with different `scope` and `direction` values.
This avoids adding new bespoke fields for each game mechanic.

### Decision: Mana is a phase-scoped spendable pool
`scope: 'phase'` + `expireUnspent: true` + `spendable: true` fully describes mana
without special-casing it. Replenishment is handled by card/ability effects that
write to the pool on trigger — the pool definition is just the bucket and its rules.

### Decision: Condition expressions are typed structured objects
Free-form strings (e.g. `"hand_empty"`) are replaced by typed condition objects.
This makes validation deterministic and allows the UI to present structured forms
rather than raw text inputs.

### Decision: Win conditions reference pools, not zones
All win/loss conditions are expressed as pool threshold checks. Zone-based endings
(e.g. "draw from empty library") are modeled as a pool that counts zone card-count,
or as a separate pool that shadows zone size — keeping the condition evaluator uniform.

## Data Model (within `GameDefinition`)

```ts
// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------
interface ZoneDefinition {
  id: string
  label: string
  owner: 'global' | 'per-player' | 'per-team'
  visibility: 'public'    // all players see all cards
            | 'private'   // owner only
            | 'hidden'    // no one sees until explicitly revealed
  ordered: boolean        // true = position matters (library/deck); false = unordered set
  interactable: boolean   // false = cards here cannot be targeted by effects
  persistent: boolean     // false = zone is cleared between rounds/hands
}

// ---------------------------------------------------------------------------
// Resource Pools
// ---------------------------------------------------------------------------
interface ResourcePoolDefinition {
  id: string
  label: string           // "Life", "Mana", "Score", "Poison Counters"
  scope: 'persistent'     // never auto-resets (life, cumulative score, poison)
       | 'round'          // resets between hands/rounds (tricks-won, meld points)
       | 'turn'           // resets each turn (action points)
       | 'phase'          // resets at phase boundary (mana)
  initialValue: number
  min?: number            // floor — undefined = no floor
  max?: number            // ceiling — undefined = no ceiling
  direction: 'up'             // only increases (poison, score)
           | 'down'           // only decreases (countdown)
           | 'bidirectional'  // can go both ways (life with healing, mana)
  spendable: boolean      // can be consumed as a cost
  expireUnspent: boolean  // unspent value clears at scope boundary (mana = true)
  owner: 'player' | 'team' | 'global'
}

// ---------------------------------------------------------------------------
// Card Costs
// ---------------------------------------------------------------------------
interface CardCost {
  poolId: string
  amount: number          // 0 = free; runtime treats as minimum required
  costType: 'spend'       // subtract from pool (mana, life-as-cost)
          | 'require'     // pool must be >= amount, not consumed
          | 'sacrifice'   // move a card from a named zone as payment (poolId unused)
  sacrificeFromZoneId?: string // required when costType === 'sacrifice'
}

// ---------------------------------------------------------------------------
// Card State (on runtime card instances, not definition)
// ---------------------------------------------------------------------------
// Stored on each card instance inside a zone at runtime:
interface CardInstanceState {
  tapped: boolean                      // exhausted; cannot activate abilities this cycle
  counters: Record<string, number>     // named counters: { loyalty: 3, time: 2 }
  attachedToCardInstanceId?: string    // enchantment/equipment attachment
}

// ---------------------------------------------------------------------------
// Turn Phases
// ---------------------------------------------------------------------------
interface PhaseTransitionCondition {
  type: string            // registered type key, e.g. "pool_threshold", "zone_empty"
  poolId?: string
  zoneId?: string
  operator?: 'eq' | 'lt' | 'lte' | 'gt' | 'gte'
  value?: number
}

interface TurnPhase {
  id: string
  label: string
  // Pools that auto-replenish when this phase starts
  poolReplenishments?: Array<{ poolId: string; amount: number | 'full' }>
  // Conditions that trigger advancement to the next phase
  transitionConditions: PhaseTransitionCondition[]
  nextPhaseId: string | null  // null = loop back to first phase
}

// ---------------------------------------------------------------------------
// Win / Loss Conditions
// ---------------------------------------------------------------------------
interface WinCondition {
  id: string
  description?: string
  trigger: {
    subject: 'self' | 'opponent' | 'any_player'
    poolId: string
    operator: 'eq' | 'lt' | 'lte' | 'gt' | 'gte'
    value: number
  }
  outcome: 'subject_loses' | 'subject_wins' | 'draw'
}
```

### Example mappings

| Game concept | Expressed as |
|---|---|
| MTG life = 0 → you lose | `{ subject: 'any_player', poolId: 'life', operator: 'lte', value: 0, outcome: 'subject_loses' }` |
| MTG poison ≥ 10 → you lose | `{ subject: 'any_player', poolId: 'poison', operator: 'gte', value: 10, outcome: 'subject_loses' }` |
| Rook score ≥ 300 → team wins | `{ subject: 'any_player', poolId: 'score', operator: 'gte', value: 300, outcome: 'subject_wins' }` |
| Rummy hand empty → you win | `{ subject: 'any_player', poolId: 'hand_size', operator: 'eq', value: 0, outcome: 'subject_wins' }` |
| MTG mana | `ResourcePoolDefinition { scope: 'phase', spendable: true, expireUnspent: true }` |
| MTG exile (interactable) | `ZoneDefinition { id: 'exile-suspended', interactable: true, visibility: 'public' }` |
| MTG exile (forgotten) | `ZoneDefinition { id: 'exile-forgotten', interactable: false, visibility: 'hidden' }` |

## APIs

| API | Purpose |
|---|---|
| `validateRulesDefinition(definition)` | Return field-level errors; empty = valid |
| `saveGameDefinition(definition)` | Persist after validation |

## Validation Rules

- Every `CardCost.poolId` must reference a declared `ResourcePoolDefinition.id`
- Every `CardCost.sacrificeFromZoneId` must reference a declared `ZoneDefinition.id`
- Every `WinCondition.trigger.poolId` must reference a declared `ResourcePoolDefinition.id`
- Every `TurnPhase.nextPhaseId` (non-null) must reference a declared `TurnPhase.id`
- Every `PhaseTransitionCondition.poolId/zoneId` must reference declared ids
- Every `poolReplenishment.poolId` must reference a declared pool
- Circular phase graphs with no exit path are flagged as errors
- Unreachable phases (no incoming transitions) are flagged as warnings

## File Changes

- `src/types/gameDefinition.ts` — add `ZoneDefinition`, `ResourcePoolDefinition`, `CardCost`,
  `CardInstanceState`, updated `TurnPhase`, updated `WinCondition`
- `src/services/gameDefinitionService.ts` — `validateRulesDefinition` implementing the above rules
- `src/components/GameDefinitionEditor.tsx` — tabbed rules editor: Zones, Resource Pools, Phases, Win Conditions
- `src/services/gameService.ts` — update `checkWinCondition` / `evaluateEndCondition` to use
  structured `WinCondition` objects instead of plain strings
