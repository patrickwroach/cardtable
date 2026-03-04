# Design: Card Catalog and Deck Constraints

## Technical Approach

Card definitions are objects in a `cards` array within the game definition Firestore document.
Deck rules are stored in a `deckRules` object on the same document. `validateCardAndDeckRules`
runs as a pure utility function before every save, returning an array of field-level errors.

## Architecture Decisions

### Decision: Inline validation before save
Validation runs client-side before the Firestore write. Prevents invalid documents from
reaching the database without requiring a cloud function in v1.

### Decision: Cards as an array in the definition document
Keeps all game definition state in one document, consistent with the rest of the definition
model.

## Data Model (within game definition)

```ts
cards: Array<{
  id: string         // unique within definition
  name: string
  type: string
  effects?: unknown  // v1 minimal; structure TBD
}>

deckRules: {
  minCards: number
  maxCards: number
  requiredCards?: string[]   // card IDs that must appear
}
```

## APIs

| API | Purpose |
|---|---|
| `saveGameDefinition(definition)` | Persist definition after client-side validation passes |
| `validateCardAndDeckRules(definition)` | Return field-level errors; empty array = valid |

## File Changes

- `src/services/gameDefinitionService.ts` — CRUD for cards/deck rules, validation
- `src/components/` — card editor UI (new component)
- `src/types/gameDefinition.ts` — extend types for `cards` and `deckRules`
