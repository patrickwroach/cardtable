# FEAT-004: Turn and Phase Orchestration

## Status

Draft

## Delivery Phase

MVP-now

## Owner

Project Maintainer

## Problem Statement

Live sessions need deterministic turn and phase progression so testers can validate rule flow consistently.

## User Story

As a tester, I want the active turn and phase to advance consistently for all players, so that gameplay follows expected rules.

## Scope

### In Scope

- Represent active turn and phase in room state.
- Advance turn/phase according to configured rules.
- Enforce turn/phase gating for player actions.
- Display active turn/phase in UI.

### Out of Scope

- Low-level realtime transport concerns.
- Session terminal-state handling.

## Functional Requirements

- FR-1: Room state exposes active player turn and active phase.
- FR-2: System advances turn/phase using configured transition rules.
- FR-3: Player actions outside allowed turn/phase are rejected with clear feedback.
- FR-4: All connected clients show same turn/phase state.

## Acceptance Criteria

- AC-1: Given game is active, when turn advances, then all clients display same next active player.
- AC-2: Given phase transition condition is met, when transition occurs, then all clients show same next phase.
- AC-3: Given user attempts out-of-turn action, when command is submitted, then action is blocked with actionable message.

## Edge Cases

- Skipped/disconnected active player.
- Circular or invalid phase transitions.

## Dependencies

- FEAT-003 room bootstrap.
- FEAT-008 rules and win-condition configuration.

## Data / API Notes

- Candidate fields: `turn`, `phase`, `activePlayerId`.
- Candidate APIs:
  - `advanceTurnOrPhase`
  - `validateTurnAction`

## Risks

- Deadlocks if transition rules are contradictory.

## Rollout Plan

1. Define runtime turn/phase state model.
2. Implement transition logic with guardrails.
3. Validate with multi-client manual tests.

## Open Questions

- Should host have override controls for stalled turns in v1?

## Traceability

- Parent epic: `docs/specs/features/FEAT-001-game-room-lifecycle.md`
- Test plan: `docs/specs/qa/TP-004-turn-and-phase-orchestration.md`
- ADR(s): TBD
