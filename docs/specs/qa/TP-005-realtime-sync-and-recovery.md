# TP-005: Realtime Sync and Recovery Test Plan

## Scope

Validates acceptance criteria in `FEAT-005-realtime-sync-and-recovery.md`.

## Test Types

- Unit: client reconciliation and error-mapping helpers.
- Integration: subscription updates, mutation failures, and reconnect path.
- Manual E2E: multi-tab/client sync and throttled network recovery.

## Scenarios

1. Happy path: mutation on one client appears on all clients.
2. Validation/error path: failed mutation surfaces actionable message.
3. Edge cases: short disconnect and re-subscription with state reconciliation.

## Test Data

- Two or more client sessions in one room
- Injected failure cases for mutation operations

## Environment

- Local: `npm run dev`
- Staging: pre-release smoke

## Exit Criteria

- All P0/P1 scenarios pass.
- No unresolved critical defects.

## Evidence

- Command output
- Manual notes/screenshots
