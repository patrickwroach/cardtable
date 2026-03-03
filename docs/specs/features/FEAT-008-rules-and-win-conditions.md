# FEAT-008: Rules and Win Conditions

## Status

Draft

## Delivery Phase

MVP-now

## Owner

Project Maintainer

## Problem Statement

Creators need to define turn/phase rules and win conditions in a structured way so runtime gameplay can evaluate them consistently.

## User Story

As a game creator, I want to configure turn phases and victory conditions, so that testers can run complete sessions with clear outcomes.

## Scope

### In Scope

- Configure turn and phase model.
- Configure phase transition conditions.
- Configure win/end conditions used by runtime.
- Validate rule consistency.

### Out of Scope

- Runtime transport/realtime behavior.
- Card/deck catalog management.

## Functional Requirements

- FR-1: Creator can define phase sequence/graph.
- FR-2: Creator can define transition conditions between phases.
- FR-3: Creator can define one or more win/end conditions.
- FR-4: System validates contradictory or unreachable rule states.

## Acceptance Criteria

- AC-1: Given valid rule model, when saved, then configuration is available to session runtime.
- AC-2: Given contradictory phase transitions, when saving, then system blocks save with explicit errors.
- AC-3: Given win condition references undefined state, when saving, then validation fails with actionable details.

## Edge Cases

- Circular transitions with no exit.
- Multiple simultaneous win conditions.

## Dependencies

- FEAT-004 for runtime consumption of turn/phase rules.
- FEAT-006 for terminal-state application.

## Data / API Notes

- Candidate schema groups: `turnPhases`, `winConditions`.
- Candidate APIs:
  - `validateRulesDefinition`
  - `saveGameDefinition`

## Risks

- Overly expressive rule model becomes hard to validate in v1.

## Rollout Plan

1. Define minimal rule expression model.
2. Implement editor + validation.
3. Integrate runtime read path.

## Open Questions

- Should phase model be strictly linear for v1?

## Traceability

- Parent epic: `docs/specs/features/FEAT-002-game-definition-management.md`
- Test plan: `docs/specs/qa/TP-008-rules-and-win-conditions.md`
- ADR(s): TBD
