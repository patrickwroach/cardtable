# TP-002: Game Definition Management Test Plan

## Scope

Epic tracking plan for `FEAT-002-game-definition-management.md`. Detailed validation is executed in child plans:

- `TP-007-card-catalog-and-deck-constraints.md`
- `TP-008-rules-and-win-conditions.md`
- `TP-009-definition-import-export-and-validation.md`

## Test Types

- Unit: tracked in TP-007 to TP-009.
- Integration: tracked in TP-007 to TP-009.
- Manual E2E: tracked in TP-007 to TP-009.

## Scenarios

1. All child test plans are executed and pass for planned phase.
2. Cross-feature integration run confirms card/deck + rules + import/export compatibility.
3. Epic closeout confirms no open P0/P1 defects across TP-007 to TP-009.

## Test Data

- Defined per child TP.

## Environment

- Local:
  - `npm run dev`
- Staging:
  - Execute child TP smoke set before release

## Exit Criteria

- All ACs from FEAT-007 to FEAT-009 pass for planned phase.
- No unresolved P0/P1 defects in creator configuration flow.

## Evidence

- Command output:
  - `npm run lint`
  - `npm run build`
- Manual notes:
  - Linked execution notes from TP-007 to TP-009
