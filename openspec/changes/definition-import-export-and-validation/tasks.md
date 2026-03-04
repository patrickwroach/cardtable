# Tasks: Definition Import/Export and Validation

## 1. Schema Version
- [ ] 1.1 Add `schemaVersion` field to `gameDefinition.ts` type
- [ ] 1.2 Define supported schema version constant(s)

## 2. Export
- [ ] 2.1 Implement `exportGameDefinition(definition)` — serialise to JSON string with schemaVersion
- [ ] 2.2 Add export button to definition editor UI
- [ ] 2.3 Trigger browser file download with a `.json` extension

## 3. Validation
- [ ] 3.1 Implement `validateGameDefinition(definition)` — check schemaVersion, required fields, and data integrity
- [ ] 3.2 Ensure validate covers: cards, deckRules, turnPhases, winConditions, schemaVersion

## 4. Import
- [ ] 4.1 Implement `importGameDefinition(jsonString)` — parse JSON → validate → return editor state
- [ ] 4.2 Add import button to definition editor UI (file picker)
- [ ] 4.3 On validation failure, surface field-level errors and keep existing draft untouched
- [ ] 4.4 On unsupported schemaVersion, surface actionable error

## 5. Verification
- [ ] 5.1 Run `npm run lint` and `npm run build` — no errors
- [ ] 5.2 Round-trip test: export → import → confirm state matches original
- [ ] 5.3 Malformed JSON test — import blocked, draft preserved
- [ ] 5.4 Unknown schema version test — import blocked with actionable error
- [ ] 5.5 Partial JSON (missing required section) test — blocked with specific field errors
