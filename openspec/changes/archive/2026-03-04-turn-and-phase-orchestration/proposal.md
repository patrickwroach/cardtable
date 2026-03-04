# Proposal: Turn and Phase Orchestration

## Intent

Live sessions need deterministic turn and phase progression so testers can validate
rule flow consistently. Without this, gameplay has no structure and sessions cannot
be meaningfully tested.

## Delivery Phase

MVP-now

## Scope

**In scope:**
- Represent active turn and phase in room state
- Advance turn/phase according to configured rules
- Enforce turn/phase gating for player actions
- Display active turn/phase in UI

**Out of scope:**
- Low-level realtime transport concerns
- Session terminal-state handling

## Approach

Store `activePlayerId`, `turn`, and `phase` in the room Firestore document. Transition
rules read from the game definition (`turnPhases` config). `advanceTurnOrPhase` writes
the next state. Action guards check `activePlayerId` before accepting mutations.

## Dependencies

- `room-access-and-session-bootstrap` must be complete to have an active room
- `rules-and-win-conditions` provides the turn/phase config consumed here

## Risks

- Deadlocks if transition rules are contradictory
- Stalled turn if active player disconnects with no host override

## Open Questions

- Should host have override controls for stalled turns in v1?
