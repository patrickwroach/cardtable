# Tasks: Turn and Phase Orchestration

## 1. State Model
- [ ] 1.1 Add `turn`, `phase`, `activePlayerId` fields to room Firestore document
- [ ] 1.2 Initialize fields on session start (first turn, first phase, first player)

## 2. Turn/Phase Advancement
- [ ] 2.1 Implement `advanceTurnOrPhase(roomId)` — read current state, apply transition, write atomically
- [ ] 2.2 Load transition rules from game definition `turnPhases` config
- [ ] 2.3 Handle circular/invalid phase transitions with a clear error

## 3. Action Gating
- [ ] 3.1 Implement `validateTurnAction(roomId, playerId)` guard
- [ ] 3.2 Apply guard to all gameplay mutation endpoints
- [ ] 3.3 Return actionable error message to client when action is blocked

## 4. UI Display
- [ ] 4.1 Show active player name/indicator in `GameTable`
- [ ] 4.2 Show current phase label in game UI
- [ ] 4.3 Disable action controls for non-active players

## 5. Verification
- [ ] 5.1 Run `npm run lint` and `npm run build` — no errors
- [ ] 5.2 Multi-client manual check: advance turn, confirm both clients show same active player
- [ ] 5.3 Out-of-turn action test: confirm blocked with visible message
