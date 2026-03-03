# FEAT-007: Card Catalog and Deck Constraints

## Status

Draft

## Delivery Phase

MVP-now

## Owner

Project Maintainer

## Problem Statement

Creators need a reliable way to author cards and deck constraints so test sessions start from a valid game definition.

## User Story

As a game creator, I want to define card data and deck limits, so that generated game setups are internally valid.

## Scope

### In Scope

- Create/edit/delete card definitions.
- Define deck composition rules (limits/requirements).
- Validate card/deck consistency before save.

### Out of Scope

- Turn/phase and win-condition modeling.
- Import/export transport format.

## Functional Requirements

- FR-1: Creator can CRUD card entries.
- FR-2: Creator can define deck limits and required cards.
- FR-3: Validation blocks save when deck constraints are violated.
- FR-4: Validation reports actionable messages at field level.

## Acceptance Criteria

- AC-1: Given valid card/deck setup, when creator saves, then definition persists for later use.
- AC-2: Given duplicate card ID or invalid deck counts, when creator saves, then save is blocked with explicit errors.
- AC-3: Given creator resolves validation issues, when creator retries save, then save succeeds.

## Edge Cases

- Card deletion leaves dangling deck references.
- Deck constraints impossible to satisfy.

## Dependencies

- FEAT-009 schema and validation serialization contracts.

## Data / API Notes

- Candidate schema groups: `cards`, `deckRules`.
- Candidate APIs:
  - `saveGameDefinition`
  - `validateCardAndDeckRules`

## Risks

- Validation complexity grows as deck rules expand.

## Rollout Plan

1. Define card/deck schema subset.
2. Implement editor and validation UX.
3. Run invalid/valid fixture tests.

## Open Questions

- Minimum effect metadata required per card in v1?

## Traceability

- Parent epic: `docs/specs/features/FEAT-002-game-definition-management.md`
- Test plan: `docs/specs/qa/TP-007-card-catalog-and-deck-constraints.md`
- ADR(s): TBD
