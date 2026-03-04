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
