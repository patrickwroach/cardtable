# TP-006: Session Completion and Host Controls Test Plan

## Scope

Validates acceptance criteria in `FEAT-006-session-completion-and-host-controls.md`.

## Test Types

- Unit: end-condition evaluation and terminal-state guard checks.
- Integration: completion and host force-end operations.
- Manual E2E: terminal-state UX and post-completion action blocking.

## Scenarios

1. Happy path: session reaches configured end condition and marks terminal state.
2. Validation/error path: host force-end flow confirmation and resulting state.
3. Edge cases: simultaneous winning actions and post-terminal action attempts.

## Test Data

- Session fixture with deterministic end condition
- Stalled-session fixture for host force-end

## Environment

- Local: `npm run dev`
- Staging: pre-release smoke

## Exit Criteria

- All P0/P1 scenarios pass.
- No unresolved critical defects.

## Evidence

- Command output
- Manual notes/screenshots
