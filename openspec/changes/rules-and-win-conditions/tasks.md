# Tasks: Rules and Win Conditions

## 1. Rule Schema
- [ ] 1.1 Extend `gameDefinition.ts` types to include `turnPhases` and `winConditions`
- [ ] 1.2 Define `TransitionCondition` and `WinCondition` types

## 2. Phase Authoring
- [ ] 2.1 Build phase editor — add/remove/reorder phases
- [ ] 2.2 Add transition condition editor per phase (type + value fields)
- [ ] 2.3 Validate no phase references an undefined `nextPhaseId`

## 3. Win Condition Authoring
- [ ] 3.1 Build win condition editor — add/remove conditions
- [ ] 3.2 Validate condition types against the supported condition registry
- [ ] 3.3 Validate references to game state fields are valid

## 4. Validation
- [ ] 4.1 Implement `validateRulesDefinition(definition)` — pure utility, returns errors[]
- [ ] 4.2 Detect circular phase transitions with no exit path
- [ ] 4.3 Detect unreachable phases
- [ ] 4.4 Block save while validation errors exist

## 5. Verification
- [ ] 5.1 Run `npm run lint` and `npm run build` — no errors
- [ ] 5.2 Valid linear phase sequence save — confirm persists
- [ ] 5.3 Contradictory transition test — save blocked with explicit error
- [ ] 5.4 Undefined-state win condition test — save blocked with actionable details
