# Proposal: Room Access and Session Bootstrap

## Intent

Testers need a predictable way to enter a room and start a session with minimal setup
friction. Without reliable room creation, join, and bootstrap flows, no test session
can begin.

## Delivery Phase

MVP-now

## Scope

**In scope:**
- Create room and assign host role
- Join by room code
- Join by shareable link
- Show room roster and waiting state
- Host starts session from waiting state

**Out of scope:**
- Turn/phase progression
- In-session action synchronization details
- Session completion logic

## Approach

Implement `createGame`, `joinGame`, and `joinGameByLink` service calls backed by
Firestore. Host role is assigned at creation. Realtime roster display via `subscribeToGame`.
`startGame` transitions room out of waiting state.

## Dependencies

- `realtime-sync-and-recovery` for robust synchronization hardening (later-phase)

## Risks

- Join failures due to stale links or race conditions around room start

## Open Questions

- Minimum players required before host can start?
