# TP-003: Room Access and Session Bootstrap Test Plan

## Scope

Validates acceptance criteria in `FEAT-003-room-access-and-session-bootstrap.md`.

## Test Types

- Unit: room code/link parsing and precondition helpers.
- Integration: create/join/start operations.
- Manual E2E: multi-browser bootstrap flow.

## Scenarios

1. Happy path: host creates room, tester joins via code/link, host starts session.
2. Validation/error path: invalid code/link and blocked start conditions.
3. Edge cases: duplicate names and near-simultaneous joins.

## Test Data

- Valid room code
- Valid share link
- Invalid room code/link

## Environment

- Local: `npm run dev`
- Staging: pre-release smoke

## Exit Criteria

- All P0/P1 scenarios pass.
- No unresolved critical defects.

## Evidence

- Command output
- Manual notes/screenshots
