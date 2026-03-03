# TP-004: Turn and Phase Orchestration Test Plan

## Scope

Validates acceptance criteria in `FEAT-004-turn-and-phase-orchestration.md`.

## Test Types

- Unit: turn/phase transition and action-gating logic.
- Integration: transition persistence and rejection of out-of-turn actions.
- Manual E2E: synchronized turn/phase visibility across clients.

## Scenarios

1. Happy path: deterministic turn and phase advancement.
2. Validation/error path: out-of-turn action rejection.
3. Edge cases: disconnected active player and invalid transition setup.

## Test Data

- Multi-player room fixture
- Valid and invalid rule transition definitions

## Environment

- Local: `npm run dev`
- Staging: pre-release smoke

## Exit Criteria

- All P0/P1 scenarios pass.
- No unresolved critical defects.

## Evidence

- Command output
- Manual notes/screenshots
