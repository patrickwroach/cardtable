# Delta: Room Lifecycle — Session Completion and Host Controls

## ADDED Requirements

### Requirement: Terminal Session State
The system MUST detect configured end conditions and transition the session to a terminal state when they are met.

#### Scenario: Win condition met
- GIVEN an active game session
- WHEN a final action satisfies the configured end condition
- THEN the session state becomes terminal for all connected clients simultaneously

### Requirement: End Result Visibility
The system MUST expose the winner and end reason to all clients in a completed session.

#### Scenario: End result displayed
- GIVEN a session has reached terminal state
- WHEN any client views the room
- THEN the winner and/or end reason are visible

### Requirement: Post-Terminal Mutation Block
The system MUST block all gameplay mutations after a session reaches terminal state.

#### Scenario: Action rejected after completion
- GIVEN a session is in terminal state
- WHEN a player attempts a gameplay action
- THEN the action is rejected and the terminal state is unchanged

### Requirement: Host Force-End
The system MUST allow the host to force-end a stalled session with explicit confirmation.

#### Scenario: Host force-ends session
- GIVEN an active session that is stalled
- WHEN the host confirms force-end
- THEN the session transitions to terminal state
- AND no further gameplay actions are accepted
