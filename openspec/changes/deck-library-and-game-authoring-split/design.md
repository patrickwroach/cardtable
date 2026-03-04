## Context

The platform currently has a single `GameDefinition` document in Firestore that owns the card catalog, deck rules, turn phases, and win conditions all at once. This was a reasonable starting point but breaks down as soon as two games share the same physical cards (Poker and Crazy Eights both use a standard 52-card deck — there is no reason to define the cards twice).

The distinction uncovered by real games:
- **Standard deck games** (Poker, Crazy Eights, Gin Rummy): identical physical cards, rules are entirely in the game layer.
- **Custom deck games** (DanDan / MtG formats): cards carry intrinsic text effects; the deck itself is the creative work; format rules constrain how many of each card you use.
- **Fully bespoke games**: cards and rules invented together; inline definition is the right path.

## Goals / Non-Goals

**Goals:**
- Introduce `DeckDefinition` as a first-class reusable entity.
- Allow `GameDefinition` to reference a `DeckDefinition` by ID (shared deck path) or embed cards inline (custom path).
- Allow `GameDefinition` to attach game-layer `cardOverrides` on top of a referenced deck.
- Provide a Deck Library editor UI separate from the Game Definition editor.
- Keep backward compatibility for existing `GameDefinition` documents that currently embed cards (treat embedded `cards[]` as the inline path).

**Non-Goals:**
- Full MtG rules engine — intrinsic card effects are stored as descriptive text, not executed logic.
- Multi-creator deck sharing / marketplace — decks are still creator-scoped for now.
- Migrating existing Firestore data (no documents in production yet; emulator-only).

## Decisions

### 1. `DeckDefinition` is its own Firestore collection
**Decision:** `deckDefinitions/{deckId}` — separate from `gameDefinitions`.

**Rationale:** Enables independent CRUD, owner-scoped queries, and a clean read path at game start (`getDoc(deckDefinitions/X)` + `getDoc(gameDefinitions/Y)`). Embedding decks inside games would prevent reuse and bloat game documents.

**Alternative considered:** Subcollection `users/{uid}/decks` — rejected because cross-user sharing becomes a nightmare later and the creatorId field already scopes queries.

---

### 2. `GameDefinition.deckSource` union: reference OR inline
**Decision:** A discriminated union field on `GameDefinition`:
```ts
deckSource:
  | { type: 'reference'; deckId: string }
  | { type: 'inline'; cards: CardDefinition[] }
```

**Rationale:** Makes the two paths structurally unambiguous. Validators and the runtime can branch on `deckSource.type` without guessing. Backward compat: existing docs that have a top-level `cards[]` field are treated as `type: 'inline'` during reads via a migration shim in the service layer.

**Alternative considered:** Optional fields `deckId?` + `inlineCards?` — rejected because it allows an invalid state where both are set, requiring extra validation.

---

### 3. `cardOverrides` lives on `GameDefinition`, keyed by card ID
**Decision:**
```ts
cardOverrides?: Record<string, CardOverride>

interface CardOverride {
  effects?: CardEffect[]      // game-layer effects (e.g. "8 = wild suit")
  pointValue?: number         // scoring override
  description?: string        // overridden display text
}
```

**Rationale:** Keeps the deck clean (deck = physical identity) and the game responsible for how its cards behave. A creator building Crazy Eights imports a standard deck and adds one override: `{ '8': { effects: [{ description: 'Declare next suit', allowedPhaseIds: ['play'] }] } }`.

---

### 4. Deck Library editor is a new top-level screen
**Decision:** `DeckLibraryEditor` component parallel to `GameDefinitionEditor`, accessible from the lobby.

**Rationale:** The Deck Library is authoring infrastructure, not part of game setup. It deserves its own entry point. The Game Definition editor gets a "pick a deck" panel that opens a modal/inline picker from the user's saved decks, or a "define cards inline" toggle.

---

### 5. Service layer split
- `deckDefinitionService.ts` — all `DeckDefinition` CRUD + validation.
- `gameDefinitionService.ts` — retains game-level validation; delegates card resolution to deck service when `deckSource.type === 'reference'`.

## Risks / Trade-offs

- **[Breaking type change]** `GameDefinition.cards` → `GameDefinition.deckSource` is a breaking schema change. Mitigation: shim in `getGameDefinition()` that normalises old shape to new shape on read.
- **[Dual validation path]** Games with `type: 'inline'` must validate cards locally; games with `type: 'reference'` must fetch the deck first to validate `cardOverrides` keys. Mitigation: `resolveCards(def)` helper that returns the effective card list regardless of source.
- **[UI complexity]** The Game Definition editor now has a conditional section (deck picker vs inline editor). Mitigation: clear toggle with explanatory copy; hide the advanced override panel behind a disclosure element.

## Migration Plan

1. Add `DeckDefinition` type + `deckDefinitionService.ts`.
2. Update `GameDefinition` type with `deckSource` union + `cardOverrides`.
3. Add shim in `getGameDefinition` / `saveGameDefinition` for old shape.
4. Build `DeckLibraryEditor` UI.
5. Revise `GameDefinitionEditor` — add deck picker + inline toggle + overrides panel.
6. Wire `DeckLibraryEditor` into `App.tsx` lobby.
7. Delete dead card-catalog code from `GameDefinitionEditor`.

Rollback: revert type and service changes; the Firestore emulator has no persistent data between sessions.

## Open Questions

- Should a game be permitted to mix `type: 'reference'` with **additional** inline cards (deck extension)? Deferring — not needed for MVP.
- Should the deck picker show community decks (other creators) eventually? Deferring to a future `deck-sharing` change.
