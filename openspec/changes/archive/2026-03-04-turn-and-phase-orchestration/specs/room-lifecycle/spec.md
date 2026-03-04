# Delta: Room Lifecycle — Turn and Phase Orchestration

## ADDED Requirements

### Requirement: Turn and Phase State Exposure
The system MUST expose the active player turn and active phase as observable state on the room.

#### Scenario: Turn state visible to all clients
- GIVEN a game session is active
- WHEN a client subscribes to the room
- THEN the active player ID and current phase are included in the room state

### Requirement: Turn and Phase Advancement
The system MUST advance the turn and phase according to the configured transition rules.

#### Scenario: Turn advances
- GIVEN a game session is active
- WHEN a turn advance is triggered
- THEN all connected clients display the same next active player

#### Scenario: Phase transitions
- GIVEN the phase transition condition is met
- WHEN the transition occurs
- THEN all connected clients show the same next phase

### Requirement: Out-of-Turn Action Rejection
The system MUST reject player actions submitted outside the player's allowed turn or phase.

#### Scenario: Out-of-turn action blocked
- GIVEN a player who is not the active player
- WHEN that player submits an action
- THEN the action is rejected with an actionable error message
- AND the room state is unchanged
