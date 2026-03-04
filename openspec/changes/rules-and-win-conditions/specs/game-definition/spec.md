# Delta: Game Definition — Rules and Win Conditions

## ADDED Requirements

### Requirement: Phase Sequence Authoring
The system MUST allow a creator to define a sequence of turn phases and their transition conditions.

#### Scenario: Phase sequence saved
- GIVEN a creator defines a valid linear phase sequence with transition conditions
- WHEN the creator saves the definition
- THEN the phase configuration is available to the session runtime

### Requirement: Win Condition Authoring
The system MUST allow a creator to define one or more win/end conditions.

#### Scenario: Win condition saved
- GIVEN a creator adds a win condition referencing valid game state
- WHEN the creator saves the definition
- THEN the win condition is persisted and evaluable by the runtime

### Requirement: Rule Consistency Validation
The system MUST validate rule configurations and block saves with contradictory or unreachable states.

#### Scenario: Contradictory phase transitions blocked
- GIVEN a creator defines phase transitions that are mutually contradictory
- WHEN the creator attempts to save
- THEN the save is blocked with explicit errors identifying the conflict

#### Scenario: Undefined state reference blocked
- GIVEN a creator writes a win condition that references an undefined state field
- WHEN the creator attempts to save
- THEN validation fails with actionable details identifying the undefined reference
