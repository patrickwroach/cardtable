# Design: Session Completion and Host Controls

## Technical Approach

End condition evaluation runs as a check inside each gameplay mutation. `evaluateEndCondition`
reads win conditions from the game definition and tests them against current room state.
When met, `completeSession` writes `status: complete`, `winner`, and `endReason` atomically.
All mutation guards check `status === complete` and return a rejection error before
processing any further writes.

## Architecture Decisions

### Decision: Inline end-condition check
Evaluated inside the mutation path rather than as a cloud function trigger. Keeps logic
co-located with the state change and avoids asynchronous evaluation lag in v1.

### Decision: Explicit host confirmation for force-end
Force-end requires a two-step UI flow (intent + confirm) to prevent accidental termination.

## Data Model Extensions (on room document)

| Field | Type | Notes |
|---|---|---|
| `status` | `waiting` \| `active` \| `complete` | Extended to include `complete` |
| `winner` | string \| null | Player ID of winner, or null for draw/abort |
| `endReason` | string | Human-readable end reason |
| `endedBy` | `condition` \| `host` | How the session ended |

## APIs

| API | Purpose |
|---|---|
| `evaluateEndCondition(roomId)` | Check win conditions against current state |
| `completeSession(roomId, winner, endReason)` | Write terminal state |
| `forceEndSession(roomId)` | Host force-end with confirmation |

## File Changes

- `src/services/gameService.ts` — add `evaluateEndCondition`, `completeSession`, `forceEndSession`
- `src/components/GameRoom.tsx` — end-game screen, winner display, host force-end button
