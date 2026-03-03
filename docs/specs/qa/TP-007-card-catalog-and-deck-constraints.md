# TP-007: Card Catalog and Deck Constraints Test Plan

## Scope

Validates acceptance criteria in `FEAT-007-card-catalog-and-deck-constraints.md`.

## Test Types

- Unit: card/deck validation rules.
- Integration: save pipeline for card/deck definitions.
- Manual E2E: creator authoring and validation feedback UX.

## Scenarios

1. Happy path: valid card/deck setup saves successfully.
2. Validation/error path: duplicate IDs and invalid deck counts are blocked.
3. Edge cases: card deletion with existing deck references.

## Test Data

- Valid card/deck fixture
- Invalid duplicate-ID fixture
- Invalid impossible-deck fixture

## Environment

- Local: `npm run dev`
- Staging: pre-release smoke

## Exit Criteria

- All P0/P1 scenarios pass.
- No unresolved critical defects.

## Evidence

- Command output
- Manual notes/screenshots
