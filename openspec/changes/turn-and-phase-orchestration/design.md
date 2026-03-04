# Design: Turn and Phase Orchestration

## Technical Approach

Turn and phase state live in the room Firestore document alongside player and status fields.
`advanceTurnOrPhase` performs a Firestore transaction that reads the current state, applies
the next-state logic from the game definition, and writes atomically.

## Architecture Decisions

### Decision: State in room document
Avoids a secondary collection. All clients subscribing to the room document get turn/phase
updates in the same snapshot as other state changes.

### Decision: Server-side transition validation
Transition rules are validated against the game definition on write, not on client. Prevents
out-of-sync clients from corrupting turn state.

## Data Model Extensions (on room document)

| Field | Type | Notes |
|---|---|---|
| `turn` | number | 1-indexed turn counter |
| `phase` | string | Active phase ID from game definition |
| `activePlayerId` | string | UID of the player whose turn it is |

## APIs

| API | Purpose |
|---|---|
| `advanceTurnOrPhase(roomId)` | Advance to next turn or phase per configured rules |
| `validateTurnAction(roomId, playerId)` | Guard: returns error if action is out-of-turn |

## File Changes

- `src/services/gameService.ts` — add `advanceTurnOrPhase`, `validateTurnAction`
- `src/components/GameTable.tsx` — display active player and phase
