# Room Lifecycle Specification

## Purpose

Covers the full lifecycle of a game room: creation, player entry, session bootstrap,
turn and phase progression, realtime state synchronization, and session completion.
This domain is the core runtime layer of the card game platform.

## Requirements

### Requirement: Room Creation
The system MUST allow a user to create a room and be assigned the host role.

#### Scenario: Successful room creation
- GIVEN a user initiates room creation
- WHEN creation succeeds
- THEN the user lands in the room lobby with the room code, shareable link, and host indicator visible

---

### Requirement: Join by Room Code
The system MUST allow a player to join a room using a valid 6-character code.

#### Scenario: Valid code join
- GIVEN a second tester has the room code
- WHEN the tester submits the valid code
- THEN both the new player and existing players see the same updated roster

#### Scenario: Invalid code
- GIVEN a tester submits an unrecognised or expired code
- WHEN the join request is submitted
- THEN an error message is displayed and the player is not added to the room

---

### Requirement: Join by Shareable Link
The system MUST allow a player to join a room by opening a valid shareable link.

#### Scenario: Valid link join
- GIVEN a tester opens a valid shareable link
- WHEN the page resolves the link
- THEN the tester enters the intended room and appears in the roster

---

### Requirement: Room Roster Display
The system MUST display the current player list and waiting status in real time.

#### Scenario: Roster update visibility
- GIVEN players are in the waiting room
- WHEN any player joins or leaves
- THEN all connected clients see the updated roster without a page reload

---

### Requirement: Session Bootstrap by Host
The system MUST allow the host to start a session from the waiting state.

#### Scenario: Host starts session
- GIVEN the room is in waiting state with the minimum number of players present
- WHEN the host triggers start
- THEN all connected clients transition out of waiting state simultaneously

---

### Requirement: Turn and Phase State Exposure
The system MUST expose the active player turn and active phase as observable state on the room.

#### Scenario: Turn state visible to all clients
- GIVEN a game session is active
- WHEN a client subscribes to the room
- THEN the active player ID and current phase are included in the room state

---

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

---

### Requirement: Out-of-Turn Action Rejection
The system MUST reject player actions submitted outside the player's allowed turn or phase.

#### Scenario: Out-of-turn action blocked
- GIVEN a player who is not the active player
- WHEN that player submits an action
- THEN the action is rejected with an actionable error message
- AND the room state is unchanged

---

### Requirement: Terminal Session State
The system MUST detect configured end conditions and transition the session to a terminal state when they are met.

#### Scenario: Win condition met
- GIVEN an active game session
- WHEN a final action satisfies the configured end condition
- THEN the session state becomes terminal for all connected clients simultaneously

---

### Requirement: End Result Visibility
The system MUST expose the winner and end reason to all clients in a completed session.

#### Scenario: End result displayed
- GIVEN a session has reached terminal state
- WHEN any client views the room
- THEN the winner and/or end reason are visible

---

### Requirement: Post-Terminal Mutation Block
The system MUST block all gameplay mutations after a session reaches terminal state.

#### Scenario: Action rejected after completion
- GIVEN a session is in terminal state
- WHEN a player attempts a gameplay action
- THEN the action is rejected and the terminal state is unchanged

---

### Requirement: Host Force-End
The system MUST allow the host to force-end a stalled session with explicit confirmation.

#### Scenario: Host force-ends session
- GIVEN an active session that is stalled
- WHEN the host confirms force-end
- THEN the session transitions to terminal state
- AND no further gameplay actions are accepted
