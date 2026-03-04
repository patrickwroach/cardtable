## Context

The platform currently has a single `GameDefinition` document in Firestore that owns the card catalog, deck rules, turn phases, and win conditions all at once. This was a reasonable starting point but breaks down along several axes as game complexity grows.

The target design space — bounded by MtG as the upper limit of authoring complexity — requires four interrelated systems that the current model cannot express:

1. **Reusable decks** — standard 52-card deck games (Poker, Crazy Eights) shouldn't require the creator to redefine the same cards. Custom-card games (DanDan, MtG-style) own their card identity.
2. **Executable card effects** — cards must be able to cause real state changes: move themselves to a zone, cause a player to draw, interact with another player's zones or hand. Pure descriptive text is insufficient.
3. **Named zones** — every game has a structured table layout (hand, play area, graveyard, shared draw pile, etc.). Zones must be first-class so effects and phases can reference them by ID.
4. **Structured phase actions** — turn phases must be able to declare which actions are allowed, restricted, or required so the runtime can enforce them without bespoke per-game logic.

## Goals / Non-Goals

**Goals:**
- Introduce `DeckDefinition` as a first-class reusable entity with a declared scope (`per-player`, `global`, or both).
- Allow `GameDefinition` to reference a `DeckDefinition` by ID or embed cards inline; support multiple deck sources per game.
- Allow `GameDefinition` to attach game-layer `cardOverrides` (including executable effects) on top of a referenced deck.
- Define `ZoneDefinition` — creator-named zones with scope (`player` | `global`), visibility, and ordering semantics.
- Define `CardEffect` as a structured executable action vocabulary (not free text), triggered by game events.
- Define `PhaseDefinition` with `allowedActions`, `requiredActions`, and `restrictedActions` lists.
- Provide a Deck Library editor UI separate from the Game Definition editor.
- Keep backward compatibility for existing `GameDefinition` documents that embed cards.

**Non-Goals:**
- Implementing the existing MtG card set or auto-importing any existing game's rules.
- Player-authored decks — deck creation is creator-only.
- Multi-creator deck sharing / marketplace — decks are creator-scoped for now.
- Migrating existing Firestore data (no documents in production; emulator-only).

## Decisions

### 1. `DeckDefinition` is its own Firestore collection
**Decision:** `deckDefinitions/{deckId}` — separate from `gameDefinitions`.

**Rationale:** Enables independent CRUD, owner-scoped queries, and a clean read path at game start. Embedding decks inside games would prevent reuse and bloat game documents.

**Alternative considered:** Subcollection `users/{uid}/decks` — rejected because cross-user sharing becomes a nightmare later and the `creatorId` field already scopes queries.

---

### 2. `GameDefinition.deckSources` is an array supporting multiple deck instances
**Decision:** Replace the single `deckSource` field with a `deckSources` array, each entry carrying a declared scope:

```ts
type DeckScope = 'per-player' | 'global'

type DeckSource =
  | { type: 'reference'; deckId: string; scope: DeckScope; label: string }
  | { type: 'inline'; cards: CardDefinition[]; scope: DeckScope; label: string }
```

**Rationale:** Some games have both a personal draw pile per player and a shared community board deck (e.g., Solitaire variants, some MtG formats). A single `deckSource` field cannot model this. The `label` field ("player deck", "shared pool") provides a stable human identifier for the editor UI and for zone/effect references.

**Alternative considered:** Separate `playerDeckSource` and `globalDeckSource` fields — rejected because it still can't model games with two global decks or two per-player decks.

**Backward compat:** Existing docs with a top-level `cards[]` field are shimmed to `deckSources: [{ type: 'inline', cards, scope: 'per-player', label: 'deck' }]` on read.

---

### 3. `ZoneDefinition` is declared on `GameDefinition`
**Decision:**

```ts
type ZoneScope = 'player' | 'global'
type ZoneVisibility = 'public' | 'owner-only' | 'hidden'

interface ZoneDefinition {
  id: string              // stable reference used by effects and phases
  name: string            // display name ("Play Area", "Graveyard", "Library")
  scope: ZoneScope        // 'player' = each player has their own instance; 'global' = one shared zone
  visibility: ZoneVisibility
  ordered: boolean        // does card order within the zone matter?
  maxSize?: number        // optional capacity limit
}
```

**Rationale:** Effects and phases need to reference zones by stable ID. Without named zones, effect actions like "move to graveyard" require hard-coded string literals scattered across card definitions with no validation. Declaring zones on the game lets the editor offer a zone picker in the effect builder and lets the runtime validate that referenced zone IDs exist.

**Well-known zones:** Creators can name zones however they like. The runtime has no reserved zone IDs — it does not special-case "hand" or "graveyard". The Deck Library editor will seed common zone names as suggestions only.

---

### 4. `CardEffect` is a structured executable action vocabulary
**Decision:** Effects are expressed as typed action objects, not free text. Each effect has a trigger and one or more actions:

```ts
type EffectTrigger =
  | 'on-play'              // card is played from hand
  | 'on-enter-zone'        // card arrives in any zone (zoneId can be specified)
  | 'on-leave-zone'        // card leaves a zone
  | 'on-discard'           // card is discarded
  | 'activated'            // player explicitly activates the effect

type EffectTarget = 'self' | 'target-player' | 'all-players' | 'all-other-players'

type CardEffectAction =
  | { type: 'move-to-zone'; zoneId: string; target: EffectTarget }
  | { type: 'draw'; count: number; target: EffectTarget }
  | { type: 'discard'; count: number; target: EffectTarget; random?: boolean }
  | { type: 'move-card-between-zones'; fromZoneId: string; toZoneId: string; target: EffectTarget }
  | { type: 'set-game-flag'; flagId: string; value: string | number | boolean }
  | { type: 'score'; delta: number; target: EffectTarget }

interface CardEffect {
  id: string
  trigger: EffectTrigger
  triggerZoneId?: string        // narrow 'on-enter-zone' / 'on-leave-zone' to a specific zone
  actions: CardEffectAction[]
  description: string           // human-readable summary shown on the card
  allowedPhaseIds?: string[]    // if set, effect is only valid during these phases
}
```

**Rationale:** A vocabulary of typed actions gives the runtime something it can actually execute without per-card bespoke logic, while keeping the authoring model within the bounds of what a game creator can configure in a UI. MtG-level complexity is achievable by chaining multiple effects per card. The `set-game-flag` action enables lightweight state machines (tracking "suit declared", "player skipped", etc.) without requiring a Turing-complete scripting layer.

**What this explicitly is not:** A scripting language. There is no conditional branching, no loops, and no access to arbitrary game state beyond the declared action vocabulary. If a game mechanic cannot be expressed as a sequence of these actions, it is out of scope for now.

---

### 5. `cardOverrides` on `GameDefinition` carries full `CardEffect` entries
**Decision:**

```ts
interface CardOverride {
  effects?: CardEffect[]
  pointValue?: number
  description?: string
}

cardOverrides?: Record<string, CardOverride>
```

**Rationale:** A creator building Crazy Eights imports a standard 52-card deck and adds one override on the 8: `effects: [{ trigger: 'on-play', actions: [{ type: 'set-game-flag', flagId: 'declared-suit', value: '' }], description: 'Declare next suit' }]`. The executable effect replaces the old descriptive-text approach.

---

### 6. `PhaseDefinition` declares action constraints
**Decision:**

```ts
type ActionType =
  | 'play-card'
  | 'draw-card'
  | 'discard-card'
  | 'activate-card-effect'
  | 'move-card-to-zone'
  | 'pass-priority'
  | 'end-phase'

type PriorityModel = 'sequential' | 'simultaneous' | 'stack'
// 'stack' = MtG-style LIFO priority; each player may respond before resolution

interface PhaseDefinition {
  id: string
  name: string
  allowedActions?: ActionType[]      // whitelist; if absent, all actions allowed
  requiredActions?: ActionType[]     // player must perform at least one before advancing
  restrictedActions?: ActionType[]   // explicit blacklist (takes precedence over allowedActions)
  priority: PriorityModel
  repeatable?: boolean               // can this phase recur within a turn?
  endsWhen: 'all-players-pass' | 'required-action-satisfied' | 'manual'
}
```

**Rationale:** Encoding action rules in data rather than per-game code means the runtime can enforce them generically. A creator building an MtG-style game declares a "Main Phase" with `allowedActions: ['play-card', 'activate-card-effect', 'pass-priority']` and `priority: 'stack'`; the runtime handles priority passing without the creator writing any logic.

---

### 7. `DeckLibraryEditor` is a new top-level screen
**Decision:** `DeckLibraryEditor` component parallel to `GameDefinitionEditor`, accessible from the lobby.

**Rationale:** The Deck Library is authoring infrastructure, not part of game setup. It deserves its own entry point. The Game Definition editor gets a "pick a deck" panel, a zone editor, and a phase builder; each of these opens as a focused subsection within the editor.

---

### 8. Service layer split
- `deckDefinitionService.ts` — all `DeckDefinition` CRUD + validation.
- `gameDefinitionService.ts` — retains game-level validation; delegates card resolution to deck service when `deckSource.type === 'reference'`; exposes `resolveCards(def)` helper.
- `zoneService.ts` — zone validation helpers (check effect action `zoneId` references exist, check zone capacity rules).

## Risks / Trade-offs

- **[Breaking type change]** `GameDefinition.cards` → `GameDefinition.deckSources` is a breaking schema change. Mitigation: read shim normalises old shape on load.
- **[Effect vocabulary gaps]** Some game mechanics may not fit the current action vocabulary. Mitigation: `set-game-flag` provides a lightweight escape hatch; vocabulary can be extended in a future change without breaking existing definitions.
- **[Priority model complexity]** `'stack'` priority is the hardest model to implement correctly in the runtime. Mitigation: defer `'stack'` to a later phase; implement `'sequential'` and `'simultaneous'` first.
- **[UI surface area]** Zone editor + effect builder + phase builder significantly increases the editor's scope. Mitigation: scope the MVP editor to the data model only (CRUD for each entity); rich drag-and-drop authoring is a later change.

## Migration Plan

1. Define `ZoneDefinition`, `CardEffect`, `CardEffectAction`, `PhaseDefinition` types.
2. Update `GameDefinition` type: `deckSources[]`, `zones[]`, `cardOverrides`, `phases[]`.
3. Add shims in `getGameDefinition` / `saveGameDefinition` for old `cards[]` shape.
4. Add `DeckDefinition` type + `deckDefinitionService.ts`.
5. Add `zoneService.ts` validation helpers.
6. Build `DeckLibraryEditor` UI (create/edit/delete deck definitions).
7. Revise `GameDefinitionEditor`: zone editor panel, deck source picker, phase builder, effect builder on cards/overrides.
8. Wire `DeckLibraryEditor` into `App.tsx` lobby.
9. Delete dead card-catalog code from `GameDefinitionEditor`.

Rollback: revert type and service changes; the Firestore emulator has no persistent data between sessions.

## Open Questions

- **Effect conditions:** Should effects support a simple `condition` predicate (e.g., "only if flag X equals Y")? Deferring — `allowedPhaseIds` covers most cases; full conditions can be added when a concrete game requires it.
- **Zone ordering enforcement:** Should the runtime enforce `ordered: true` zones, or is ordering advisory? Deferring — treat as advisory for now; runtime enforcement is a later change.
- **`'stack'` priority model:** Defer implementation to the `turn-and-phase-orchestration` change; mark as `priority: 'sequential'` in all current games and document the limitation.
- **Deck picker showing community decks:** Deferring to a future `deck-sharing` change.
