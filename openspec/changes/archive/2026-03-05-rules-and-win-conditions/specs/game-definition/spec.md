# Delta: Game Definition — Rules and Win Conditions

> **Note:** This spec replaces the original narrow model (plain-string conditions, no zones, no
> resource pools). The full rationale and data model are in `design.md`.
> These requirements are intentionally extensible — the rule type registries are open, not
> exhaustive. New condition types and pool behaviors can be added without breaking existing definitions.

## ADDED Requirements

### Requirement: Zone Authoring
The system MUST allow a creator to define arbitrary named zones with configurable behavioral properties.

#### Scenario: Zones defined and saved
- GIVEN a creator adds zones (e.g. "Library", "Battlefield", "Exile — Suspended")
- WHEN the creator saves the definition
- THEN all zones with their visibility, ordering, and interactability settings are persisted

#### Scenario: Multiple zones with same label but different behavior
- GIVEN a creator defines two zones with the same display label but distinct IDs and properties
- WHEN the definition is saved
- THEN both zones are persisted independently and rules can reference them by ID

### Requirement: Resource Pool Authoring
The system MUST allow a creator to define one or more named resource pools with scoping and
direction rules.

#### Scenario: Persistent pool defined (e.g. Life)
- GIVEN a creator adds a pool with scope `persistent`, direction `bidirectional`, initialValue 20
- WHEN the creator saves the definition
- THEN the pool is persisted and the runtime initialises each player at 20 on session start

#### Scenario: Phase-scoped spendable pool defined (e.g. Mana)
- GIVEN a creator adds a pool with scope `phase`, spendable true, expireUnspent true
- WHEN the creator saves the definition
- THEN the pool is persisted and the runtime clears unspent value at each phase boundary

#### Scenario: Round-scoped accumulation pool defined (e.g. Tricks Won)
- GIVEN a creator adds a pool with scope `round`, direction `up`
- WHEN the creator saves the definition
- THEN the pool is persisted and the runtime resets it to initialValue between rounds

### Requirement: Phase Sequence Authoring
The system MUST allow a creator to define a linear sequence of turn phases with structured
transition conditions and phase-start pool replenishments.

#### Scenario: Phase sequence with pool replenishment saved
- GIVEN a creator defines phases where one phase replenishes a mana pool on entry
- WHEN the creator saves the definition
- THEN the phase configuration including replenishments is available to the session runtime

#### Scenario: Phase transition referencing a pool threshold
- GIVEN a creator sets a transition condition of type `pool_threshold` referencing a declared pool
- WHEN the creator saves the definition
- THEN the transition is persisted and will be evaluated by the runtime

### Requirement: Win and Loss Condition Authoring
The system MUST allow a creator to define structured win/loss conditions that reference declared
resource pools. Conditions identify the subject, pool, threshold operator, value, and outcome.

#### Scenario: Loss condition on pool depletion (e.g. life ≤ 0)
- GIVEN a creator adds a condition: any_player, pool `life`, operator `lte`, value 0, outcome `subject_loses`
- WHEN the creator saves the definition
- THEN the runtime evaluates this condition after each gameplay mutation

#### Scenario: Win condition on score threshold (e.g. score ≥ 300)
- GIVEN a creator adds a condition: any_player, pool `score`, operator `gte`, value 300, outcome `subject_wins`
- WHEN the creator saves the definition
- THEN the runtime triggers session completion when any player's score pool hits 300

#### Scenario: Accumulation loss condition (e.g. poison ≥ 10)
- GIVEN a creator adds a condition: any_player, pool `poison`, operator `gte`, value 10, outcome `subject_loses`
- WHEN the creator saves the definition
- THEN the runtime evaluates the condition and marks the affected player as losing

### Requirement: Referential Integrity Validation
The system MUST validate that all pool and zone references in phases, costs, and conditions
resolve to declared definitions. Broken references block save.

#### Scenario: Win condition references undeclared pool — blocked
- GIVEN a creator adds a win condition referencing pool id `mana` which has not been declared
- WHEN the creator attempts to save
- THEN the save is blocked with an error identifying the undefined pool reference

#### Scenario: Phase transition references undeclared zone — blocked
- GIVEN a creator adds a phase transition condition referencing zone id `graveyard` which has not been declared
- WHEN the creator attempts to save
- THEN the save is blocked with an error identifying the undefined zone reference

#### Scenario: Phase graph cycle with no exit — blocked
- GIVEN a creator defines phase transitions that form a cycle with no reachable terminal phase
- WHEN the creator attempts to save
- THEN the save is blocked with an explicit error identifying the cycle

#### Scenario: Unreachable phase — warning
- GIVEN a creator defines a phase that no other phase transitions to
- WHEN the creator views the editor
- THEN the definition is saved but marked incomplete with a warning identifying the unreachable phase

### Requirement: Open Rule Type Registry
The rule type system MUST be extensible. Unknown condition types that are not in the
supported registry MUST be saved with a warning (not blocked) so that definitions
are forward-compatible as new types are added.

#### Scenario: Unknown condition type saved with warning
- GIVEN a creator enters a transition condition type that is not in the current registry
- WHEN the creator saves
- THEN the definition saves successfully but is marked incomplete with a warning
  identifying the unrecognised type
