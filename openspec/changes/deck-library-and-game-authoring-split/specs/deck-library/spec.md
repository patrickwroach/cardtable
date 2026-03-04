## ADDED Requirements

### Requirement: Deck Creation
The system SHALL allow a creator to create a new named deck definition.

#### Scenario: Successful deck creation
- **WHEN** a creator submits a deck with a non-empty name
- **THEN** the deck is persisted to Firestore and appears in the creator's deck list

---

### Requirement: Card Catalog CRUD within a Deck
The system SHALL allow a creator to add, edit, and delete cards within a deck definition.

#### Scenario: Add card to deck
- **WHEN** a creator submits a card with a non-empty name
- **THEN** the card is added to the deck with a system-generated unique ID

#### Scenario: Edit card in deck
- **WHEN** a creator updates an existing card's name, description, or type
- **THEN** the deck reflects the updated card data

#### Scenario: Delete card from deck
- **WHEN** a creator deletes a card
- **THEN** the card is removed from the deck catalog

---

### Requirement: Intrinsic Card Effects
The system SHALL allow a creator to define intrinsic effects on a card within a deck (e.g. Magic-style card text).

#### Scenario: Add effect to card
- **WHEN** a creator adds an effect description to a card
- **THEN** the effect is stored on the card definition and displayed in the editor

---

### Requirement: Deck List by Creator
The system SHALL display all decks created by the authenticated user.

#### Scenario: Creator views deck list
- **WHEN** the deck library editor is opened
- **THEN** all decks owned by the current user are listed, sorted by most recently updated

---

### Requirement: Deck Persistence
The system SHALL persist deck definitions independently of any game definition.

#### Scenario: Deck saved independently
- **WHEN** a creator saves a deck
- **THEN** the deck is written to the `deckDefinitions` Firestore collection and is not nested inside any game definition
