# Tasks: Rules and Win Conditions

## 1. Type Definitions
- [x] 1.1 Add `ZoneDefinition` type to `gameDefinition.ts`
- [x] 1.2 Add `ResourcePoolDefinition` type to `gameDefinition.ts`
- [x] 1.3 Add `CardCost` type to `gameDefinition.ts`
- [x] 1.4 Add `CardInstanceState` type to `gameDefinition.ts` (runtime state, not definition)
- [x] 1.5 Replace plain-string `WinCondition.condition` with structured trigger object (subject / poolId / operator / value / outcome)
- [x] 1.6 Update `TurnPhase` to include structured `transitionConditions`, `poolReplenishments`, and typed `nextPhaseId`
- [x] 1.7 Add `zones` and `resourcePools` arrays to `GameDefinition`

## 2. Zone Authoring UI
- [x] 2.1 Build zone editor — add/remove zones with id, label, owner, visibility, ordered, interactable, persistent fields
- [x] 2.2 Validate no duplicate zone IDs within a definition

## 3. Resource Pool Authoring UI
- [x] 3.1 Build pool editor — add/remove pools with all `ResourcePoolDefinition` fields
- [x] 3.2 Validate no duplicate pool IDs within a definition
- [x] 3.3 Validate `scope` and `direction` combinations are internally consistent (e.g. `direction: 'up'` + `expireUnspent: true` is a warning)

## 4. Phase Authoring UI
- [x] 4.1 Build phase editor — add/remove/reorder phases
- [x] 4.2 Add pool replenishment editor per phase (poolId + amount)
- [x] 4.3 Add structured transition condition editor per phase (type, poolId/zoneId, operator, value)
- [x] 4.4 Validate `nextPhaseId` references a declared phase (or null)
- [x] 4.5 Validate transition condition `poolId`/`zoneId` references declared ids

## 5. Win / Loss Condition Authoring UI
- [x] 5.1 Build win condition editor — add/remove conditions with subject/poolId/operator/value/outcome fields
- [x] 5.2 Validate `poolId` in every condition references a declared resource pool
- [x] 5.3 Show warning (not error) for unknown condition types not in the supported registry

## 6. Validation Service
- [x] 6.1 Implement `validateRulesDefinition(definition)` — pure utility, returns `{ errors: string[], warnings: string[] }`
- [x] 6.2 Detect circular phase graphs with no exit path (error)
- [x] 6.3 Detect unreachable phases — no incoming transitions (warning)
- [x] 6.4 Detect all broken pool/zone cross-references (error)
- [x] 6.5 Block save when `errors` is non-empty; allow save with warnings (mark definition incomplete)
- [x] 6.6 Update `evaluateEndCondition` in `gameService.ts` to use structured `WinCondition` trigger objects instead of plain strings

## 7. Verification
- [x] 7.1 Run `npm run lint` and `npm run build` — no errors
- [x] 7.2 Zone + pool + phase + win-condition save — confirm all fields persist to Firestore
- [x] 7.3 Broken pool reference — save blocked with explicit error
- [x] 7.4 Phase cycle with no exit — save blocked with explicit error
- [ ] 7.5 Unknown condition type — saves with warning, definition marked incomplete *(deferred: requires import/export feature to inject a custom condition type; covered by `definition-import-export-and-validation` change)*
- [x] 7.6 Runtime evaluation test — win condition triggers `completeSession` correctly
