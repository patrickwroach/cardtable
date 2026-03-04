# Tasks: Turn and Phase Orchestration

## 1. State Model
- [x] 1.1 Add `turn`, `phase`, `activePlayerId` fields to room Firestore document
- [x] 1.2 Initialize fields on session start (first turn, first phase, first player)

## 2. Turn/Phase Advancement
- [x] 2.1 Implement `advanceTurnOrPhase(roomId)` — read current state, apply transition, write atomically
- [x] 2.2 Load transition rules from game definition `turnPhases` config
- [x] 2.3 Handle circular/invalid phase transitions with a clear error

## 3. Action Gating
- [x] 3.1 Implement `validateTurnAction(roomId, playerId)` guard
- [x] 3.2 Apply guard to all gameplay mutation endpoints
- [x] 3.3 Return actionable error message to client when action is blocked

## 4. UI Display
- [x] 4.1 Show active player name/indicator in `GameTable`
- [x] 4.2 Show current phase label in game UI
- [x] 4.3 Disable action controls for non-active players

## 5. Verification
- [x] 5.1 Run `npm run lint` and `npm run build` — no errors
- [x] 5.2 Multi-client manual check: advance turn, confirm both clients show same active player
- [x] 5.3 Out-of-turn action test: confirm blocked with visible message
