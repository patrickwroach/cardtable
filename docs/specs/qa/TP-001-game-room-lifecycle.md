# TP-001: Game Room Lifecycle Test Plan

## Scope

Validates acceptance criteria in `FEAT-001-game-room-lifecycle.md` for create/join/start/draw/play and failure handling.

## Test Types

- Unit:
  - Deck utilities (`createDeck`, `drawCards` behavior).
- Integration:
  - Service-layer Firestore operations.
- Manual E2E:
  - Multi-browser create/join/play flow.

## Scenarios

1. Happy path:
   - Host creates room, second player joins, host starts game, both draw and play.
2. Validation/error path:
   - Join with invalid room ID shows clear error.
   - Draw from empty deck is blocked or returns controlled failure.
3. Edge cases:
   - Two players perform actions close in time; clients converge on same final state.

## Test Data

- Two player names.
- One valid room ID from live create flow.
- One invalid room ID.

## Environment

- Local:
  - `npm run dev`
  - Firebase test project config
- Staging:
  - same scenarios before release

## Exit Criteria

- All ACs from FEAT-001 pass.
- No P0/P1 defects remain open.

## Evidence

- Command output:
  - `npm run lint`
  - `npm run build`
- Manual notes:
  - Browser A/B actions and observed state synchronization.
