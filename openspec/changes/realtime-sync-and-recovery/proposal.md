# Proposal: Realtime Sync and Recovery

## Intent

Test sessions rely on synchronised state across clients. Transient failures must not
leave clients in a diverged or silently corrupted state. Without explicit recovery paths,
testers cannot trust session results.

## Delivery Phase

Later-phase (harden after core playable loop is stable)

## Scope

**In scope:**
- Realtime room subscription behaviour
- Consistent client-state reconciliation
- User-facing error messages for failed mutations
- Recovery behaviour after short network interruptions

**Out of scope:**
- Business rules for turn/phase and victory
- Analytics/telemetry pipeline

## Approach

Firestore `onSnapshot` subscription handles realtime updates. Failed mutations surface
errors through a centralised error handler. On reconnect, force-resubscribe and compare
local state against server snapshot before rendering.

## Dependencies

- Firebase Firestore availability

## Risks

- Race conditions cause temporary client divergence
- Reconnect after significant state drift may require full re-fetch

## Open Questions

- Should reconnect use optimistic local cache or server-first replacement in v1?
