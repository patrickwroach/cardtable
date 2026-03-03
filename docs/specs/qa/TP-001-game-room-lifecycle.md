# TP-001: Game Room Lifecycle Test Plan

## Scope

Epic tracking plan for `FEAT-001-game-room-lifecycle.md`. Detailed validation is executed in child plans:

- `TP-003-room-access-and-session-bootstrap.md`
- `TP-004-turn-and-phase-orchestration.md`
- `TP-005-realtime-sync-and-recovery.md`
- `TP-006-session-completion-and-host-controls.md`

## Test Types

- Unit: tracked in TP-003 to TP-006.
- Integration: tracked in TP-003 to TP-006.
- Manual E2E: tracked in TP-003 to TP-006.

## Scenarios

1. All child test plans are executed and pass for planned phase.
2. Cross-feature integration run confirms room bootstrap → play flow → completion path.
3. Epic closeout confirms no open P0/P1 defects across TP-003 to TP-006.

## Test Data

- Defined per child TP.

## Environment

- Local:
  - `npm run dev`
- Staging:
  - Execute child TP smoke set before release

## Exit Criteria

- All ACs from FEAT-003 to FEAT-006 pass for planned phase.
- No P0/P1 defects remain open.

## Evidence

- Command output:
  - `npm run lint`
  - `npm run build`
- Manual notes:
  - Linked execution notes from TP-003 to TP-006.
