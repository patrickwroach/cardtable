# FEAT-003: Room Access and Session Bootstrap

## Status

Draft

## Delivery Phase

MVP-now

## Owner

Project Maintainer

## Problem Statement

Testers need a predictable way to enter a room and start a session with minimal setup friction.

## User Story

As a tester, I want to create or join a room by code/link and see ready-state information, so that we can start a test session quickly.

## Scope

### In Scope

- Create room and assign host role.
- Join by room code.
- Join by shared link.
- Show room roster and waiting state.
- Host starts session from waiting state.

### Out of Scope

- Turn/phase progression.
- In-session action synchronization details.
- Session completion logic.

## Functional Requirements

- FR-1: User can create room and become host.
- FR-2: User can join room with valid code.
- FR-3: User can join room with valid shareable link.
- FR-4: Room UI shows current player list and waiting status.
- FR-5: Host can start session when preconditions are met.

## Acceptance Criteria

- AC-1: Given room creation succeeds, when user lands in room, then room code/link and host indicator are visible.
- AC-2: Given second tester joins with valid code, when join completes, then both clients show same roster.
- AC-3: Given tester opens valid share link, when join completes, then they enter the intended room.
- AC-4: Given room is waiting, when host starts session, then all clients transition out of waiting state.

## Edge Cases

- Invalid room code.
- Expired or malformed share link.
- Duplicate display names in same room.

## Dependencies

- FEAT-005 for robust synchronization and recovery.

## Data / API Notes

- Candidate APIs:
  - `createGame`
  - `joinGame`
  - `joinGameByLink`
  - `startGame`
  - `subscribeToGame`

## Risks

- Join failures due to stale links or race conditions around room start.

## Rollout Plan

1. Implement create/join flows.
2. Add host-start precondition checks.
3. Verify multi-client room bootstrap.

## Open Questions

- Minimum players required before host can start?

## Traceability

- Parent epic: `docs/specs/features/FEAT-001-game-room-lifecycle.md`
- Test plan: `docs/specs/qa/TP-003-room-access-and-session-bootstrap.md`
- ADR(s): `docs/specs/adrs/ADR-0001-nextjs-app-router-migration.md`
