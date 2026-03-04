# Tasks: Card Catalog and Deck Constraints

## 1. Card Schema
- [x] 1.1 Extend `gameDefinition.ts` types to include `cards` array and `deckRules` object
- [x] 1.2 Ensure Firestore read/write paths handle the extended definition shape

## 2. Card CRUD
- [x] 2.1 Implement create card — add entry to `cards` array
- [x] 2.2 Implement edit card — update matching entry by ID
- [x] 2.3 Implement delete card — remove entry; check for dangling deck references
- [x] 2.4 Build card editor UI component with field-level validation display

## 3. Deck Rules Authoring
- [x] 3.1 Implement deck rules editor (min/max card count, required cards list)
- [x] 3.2 Display deck rule fields with field-level error messages

## 4. Validation
- [x] 4.1 Implement `validateCardAndDeckRules(definition)` — pure utility, returns errors[]
- [x] 4.2 Block save button while validation errors exist
- [x] 4.3 Duplicate card ID check
- [x] 4.4 Deck-count range sanity check (min ≤ max)
- [x] 4.5 Required-cards cross-reference check (all IDs exist in cards array)

## 5. Verification
- [x] 5.1 Run `npm run lint:all` and `npm run build` — no errors
- [ ] 5.2 Valid card/deck fixture save test — confirm persistence
- [ ] 5.3 Duplicate ID test — confirm error shown and save blocked
- [ ] 5.4 Impossible deck constraint test — confirm error shown and save blocked
