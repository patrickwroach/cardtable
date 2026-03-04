## ADDED Requirements

### Requirement: Deck Source Selection
The system SHALL allow a game definition to source its cards from either a referenced deck or an inline card list.

#### Scenario: Creator selects referenced deck
- **WHEN** a creator picks an existing deck from the deck library when authoring a game definition
- **THEN** the game definition stores `deckSource: { type: 'reference', deckId }` and no inline card list

#### Scenario: Creator defines cards inline
- **WHEN** a creator chooses the inline option and adds cards directly in the game definition editor
- **THEN** the game definition stores `deckSource: { type: 'inline', cards: [...] }`

---

### Requirement: Card Override Authoring
The system SHALL allow a creator to attach game-layer effects to specific cards from a referenced deck.

#### Scenario: Add game-layer effect to a card
- **WHEN** a creator adds an override for a card ID that exists in the referenced deck
- **THEN** the override is stored in `cardOverrides[cardId]` on the game definition

#### Scenario: Override references unknown card
- **WHEN** a creator saves a game definition with a `cardOverrides` key that does not exist in the resolved deck
- **THEN** validation fails and the save is blocked with an actionable error message

---

### Requirement: Effective Card List Resolution
The system SHALL resolve the effective card list for a game definition regardless of deck source type.

#### Scenario: Referenced deck resolution
- **WHEN** a game definition with `deckSource.type === 'reference'` is loaded
- **THEN** the runtime fetches cards from the referenced `DeckDefinition` document

#### Scenario: Inline card resolution
- **WHEN** a game definition with `deckSource.type === 'inline'` is loaded
- **THEN** the runtime uses the embedded card list directly without a secondary fetch

## REMOVED Requirements

### Requirement: Card Catalog Embedded in Game Definition
**Reason**: Card catalog has moved to `DeckDefinition`. Games now reference a deck or embed cards via the `deckSource` union. The top-level `cards[]` array on `GameDefinition` is deprecated.
**Migration**: Existing game definitions with a top-level `cards[]` field are transparently normalised to `deckSource: { type: 'inline', cards }` on read by the service layer.
