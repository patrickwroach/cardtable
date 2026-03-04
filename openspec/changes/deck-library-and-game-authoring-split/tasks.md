# Tasks: Deck Library and Game Authoring Split

## 1. Type System

- [ ] 1.1 Create `DeckDefinition` interface in `src/types/deckDefinition.ts` — `id, creatorId, name, cards[], schemaVersion, createdAt, updatedAt`
- [ ] 1.2 Add `CardIntrinsicEffect` interface (deck-layer effects — descriptive text, not game logic)
- [ ] 1.3 Add `deckSource` discriminated union to `GameDefinition`: `{ type: 'reference'; deckId: string } | { type: 'inline'; cards: CardDefinition[] }`
- [ ] 1.4 Add `CardOverride` interface: `{ effects?: CardEffect[]; pointValue?: number; description?: string }`
- [ ] 1.5 Add `cardOverrides?: Record<string, CardOverride>` to `GameDefinition`
- [ ] 1.6 Deprecate top-level `cards` field on `GameDefinition` (keep as optional for backward compat shim)

## 2. Deck Definition Service

- [ ] 2.1 Create `src/services/deckDefinitionService.ts`
- [ ] 2.2 Implement `saveDeckDefinition(deck)` — write to `deckDefinitions/{id}`
- [ ] 2.3 Implement `getDeckDefinition(deckId)` — fetch single deck
- [ ] 2.4 Implement `listDeckDefinitionsByCreator(creatorId)` — query by `creatorId`
- [ ] 2.5 Implement `validateDeckDefinition(deck)` — name required, no duplicate card IDs
- [ ] 2.6 Move card CRUD helpers (`addCard`, `updateCard`, `deleteCard`) from `gameDefinitionService.ts` to `deckDefinitionService.ts` and update imports

## 3. Game Definition Service Updates

- [ ] 3.1 Add `resolveCards(def)` helper — returns effective `CardDefinition[]` regardless of `deckSource.type` (fetches deck for reference type; uses inline cards directly)
- [ ] 3.2 Add backward compat shim in `getGameDefinition` — normalise old `cards[]` field to `deckSource: { type: 'inline', cards }`
- [ ] 3.3 Update `validateGameDefinition` — validate `cardOverrides` keys exist in resolved card list
- [ ] 3.4 Update `saveGameDefinition` — write `deckSource` union; strip deprecated top-level `cards` field on save

## 4. Deck Library Editor UI

- [ ] 4.1 Create `src/components/DeckLibraryEditor.tsx` — picker screen + deck editor screen
- [ ] 4.2 Picker screen: list creator's decks (name, card count, updated date) + "New Deck" button
- [ ] 4.3 Deck editor screen: name field, card catalog table, add/edit card form (name, description, type, intrinsic effect)
- [ ] 4.4 Save / Back buttons with validation gating (save disabled while name empty or duplicate card IDs)
- [ ] 4.5 Wire `DeckLibraryEditor` into `App.tsx` — add `showDeckLibrary` state and lobby entry point

## 5. Game Definition Editor Revision

- [ ] 5.1 Replace embedded card catalog section with a deck source toggle: "Use a saved deck" / "Define cards inline"
- [ ] 5.2 "Use a saved deck" path: deck picker panel listing creator's decks; selected deck name shown with a "Change" button
- [ ] 5.3 "Define cards inline" path: retain existing card catalog form (add/edit/delete within the game definition)
- [ ] 5.4 Add card overrides panel (shown only when a reference deck is selected): lists cards from the deck with an "Add override" action per card; override form for effect description and point value
- [ ] 5.5 Update `GameLobby.tsx` — add "Deck Library" button alongside "Game Definition Editor" button

## 6. Lobby Entry Point

- [ ] 6.1 Add `onOpenDeckLibrary?: () => void` prop to `GameLobby`
- [ ] 6.2 Render "Deck Library" button in lobby menu

## 7. Verification

- [ ] 7.1 Run `npm run lint:all` and `npm run build` — no errors
- [ ] 7.2 Create a deck with 5 cards — confirm it saves independently in Firestore `deckDefinitions` collection
- [ ] 7.3 Create a game that references the saved deck — confirm `deckSource.type === 'reference'` is stored
- [ ] 7.4 Add a card override to the game — confirm override is stored and validation rejects unknown card IDs
- [ ] 7.5 Create a game with inline cards — confirm `deckSource.type === 'inline'` is stored
