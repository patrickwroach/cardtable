# Design: Realtime Sync and Recovery

## Technical Approach

All room state is consumed via a single `onSnapshot` Firestore listener. Mutation errors
are surfaced through a shared error-handling utility so every service call produces a
consistent user-visible failure message. On reconnect, the subscription is torn down and
re-established, and the first snapshot event is treated as the authoritative server state.

## Architecture Decisions

### Decision: Server-first on reconnect
On reconnect, discard any pending local state and accept the first server snapshot as truth.
Prevents stale optimistic state from persisting across a disconnect.

### Decision: Centralised mutation error handler
All Firestore writes go through a wrapper that catches errors and returns a standardised
`{ success, error }` shape. UI components consume this to show actionable messages.

## APIs

| API | Purpose |
|---|---|
| `subscribeToGame(roomId, onUpdate, onError)` | Realtime room subscription with error callback |
| `resubscribeToGame(roomId)` | Tear down and re-establish subscription after disconnect |
| `handleMutationError(error)` | Normalise Firestore error to user-facing message |

## File Changes

- `src/services/gameService.ts` — add error handling wrapper, resubscribe logic
- `src/components/GameRoom.tsx` — show connection/error status banner
