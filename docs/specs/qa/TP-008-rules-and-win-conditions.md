# TP-008: Rules and Win Conditions Test Plan

## Scope

Validates acceptance criteria in `FEAT-008-rules-and-win-conditions.md`.

## Test Types

- Unit: rules consistency and win-condition validators.
- Integration: save/load pipeline for rules definitions.
- Manual E2E: creator workflow for phases and victory rules.

## Scenarios

1. Happy path: valid rules and win conditions save and load.
2. Validation/error path: contradictory transitions and invalid references rejected.
3. Edge cases: circular phases and simultaneous win conditions.

## Test Data

- Valid linear phase model fixture
- Invalid contradictory-transition fixture
- Invalid undefined-state win-condition fixture

## Environment

- Local: `npm run dev`
- Staging: pre-release smoke

## Exit Criteria

- All P0/P1 scenarios pass.
- No unresolved critical defects.

## Evidence

- Command output
- Manual notes/screenshots
