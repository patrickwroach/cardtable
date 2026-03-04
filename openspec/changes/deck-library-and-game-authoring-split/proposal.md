## Why

The current `GameDefinition` model conflates two distinct concepts: the physical card catalog (what cards exist and what they look like) and the game rules (how those cards behave in a specific game). This forces creators to redefine the same 52-card deck for every game that uses it, and makes it impossible to share decks across games like Poker and Crazy Eights that use identical cards but entirely different rules.

## What Changes

- **BREAKING** — Introduce `DeckDefinition` as a new first-class entity with its own Firestore collection (`deckDefinitions`), separate from `GameDefinition`.
- `DeckDefinition` holds the pure card catalog: card identity, physical attributes (suit, rank, imageUrl, description), and any intrinsic card effects (e.g. Magic-style text that is part of the card itself).
- `GameDefinition` is revised to reference a `DeckDefinition` by ID (`deckId`) OR embed an inline card list (`inlineCards`) for fully custom games.
- A new `cardOverrides` map on `GameDefinition` allows attaching game-layer rules to specific cards from the referenced deck (e.g. "in this game, the 8 of any suit allows the player to declare the next suit").
- `DeckDefinition` gets its own editor UI (Deck Library editor) separate from the Game Definition editor.
- The existing Game Definition editor is revised to let creators pick a deck from the library or define cards inline.
- All validation, import/export, and CRUD service helpers are split to respect the new boundary.

## Capabilities

### New Capabilities
- `deck-library`: Authoring and persistence of reusable `DeckDefinition` documents — create, edit, delete decks; card catalog CRUD within a deck; list decks by creator.

### Modified Capabilities
- `game-definition`: Requirements change — a game definition now references a deck or defines cards inline; card effects at the game layer (overrides) are a new requirement; the card catalog CRUD moves to the deck domain.

## Impact

- `src/types/gameDefinition.ts` — `GameDefinition` schema change; new `DeckDefinition` type.
- `src/services/gameDefinitionService.ts` — split card CRUD into `deckDefinitionService.ts`; update validation to handle both reference-deck and inline-cards modes.
- New `src/services/deckDefinitionService.ts`.
- New `src/components/DeckLibraryEditor.tsx`.
- `src/components/GameDefinitionEditor.tsx` — revised to drop embedded card catalog in favour of deck picker + optional card overrides panel.
- `src/App.tsx` — wire Deck Library editor entry point alongside Game Definition editor.
- Firestore: new `deckDefinitions` collection; `gameDefinitions` documents gain `deckId?` / `inlineCards?` / `cardOverrides?` fields.
