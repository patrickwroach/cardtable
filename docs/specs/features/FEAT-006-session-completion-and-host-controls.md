# FEAT-006: Session Completion and Host Controls

## Status

Draft

## Delivery Phase

MVP-now

## Owner

Project Maintainer

## Problem Statement

Test sessions need a clear terminal-state model and minimal host controls to avoid stalled or ambiguous endings.

## User Story

As a tester, I want sessions to end clearly when win conditions are met, and as a host I need minimal controls to handle stalls.

## Scope

### In Scope

- Detect and apply terminal session state.
- Display winner/end reason to all clients.
- Provide host force-end control for stalled sessions.
- Prevent further gameplay mutations after terminal state.

### Out of Scope

- Post-game analytics and feedback capture.
- Tournament/match history.

## Functional Requirements

- FR-1: System evaluates configured end conditions and marks session complete when met.
- FR-2: Completed session exposes winner and/or end reason.
- FR-3: Host can force-end a session with explicit confirmation.
- FR-4: Gameplay actions are blocked after completion.

## Acceptance Criteria

- AC-1: Given end condition is met, when final action resolves, then session state becomes terminal for all clients.
- AC-2: Given terminal session, when users view room, then winner/end reason is visible.
- AC-3: Given stalled session, when host force-ends, then session transitions to terminal state and blocks new gameplay actions.

## Edge Cases

- Simultaneous actions that both satisfy end condition.
- Host disconnect before force-end confirmation.

## Dependencies

- FEAT-004 turn/phase orchestration.
- FEAT-008 rules and win-condition configuration.

## Data / API Notes

- Candidate fields: `status`, `winner`, `endReason`, `endedBy`.
- Candidate APIs:
  - `evaluateEndCondition`
  - `completeSession`
  - `forceEndSession`

## Risks

- Premature session ending if end-condition evaluation is incorrect.

## Rollout Plan

1. Implement terminal-state transitions.
2. Implement host force-end flow.
3. Verify lockout of post-terminal actions.

## Open Questions

- Should force-end assign a winner or only mark session aborted?

## Traceability

- Parent epic: `docs/specs/features/FEAT-001-game-room-lifecycle.md`
- Test plan: `docs/specs/qa/TP-006-session-completion-and-host-controls.md`
- ADR(s): TBD
