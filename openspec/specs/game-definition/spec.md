# Game Definition Specification

## Purpose

Covers creator tooling for authoring game definitions: card catalogs, deck constraints,
turn/phase rules, win conditions, and portable import/export. This domain supplies the
configuration layer consumed by the room-lifecycle runtime.

## Requirements

### Requirement: Card Authoring
The system MUST allow a creator to create, edit, and delete card definitions.

#### Scenario: Valid card/deck saved
- GIVEN a creator has defined cards and deck rules that satisfy all constraints
- WHEN the creator saves the definition
- THEN the definition persists and is available for session use

### Requirement: Unique Card IDs
The system MUST guarantee that every card in a definition has a unique ID.

#### Scenario: Duplicate card ID prevented at entry
- GIVEN a creator enters a card name
- WHEN the card is added to the catalog
- THEN the system auto-generates a unique slugified ID (e.g. `ace-of-spades-1`) without creator input; no duplicate can be introduced

### Requirement: Deck Constraint Authoring
The system MUST allow a creator to define deck limits and required cards.

#### Scenario: Deck rules editable
- GIVEN a creator opens the deck rules editor
- WHEN the creator sets min/max counts and required card IDs
- THEN those values are stored on the definition and included in the next save

### Requirement: Card and Deck Validation
The system MUST validate card and deck consistency and surface warnings to the creator.
Warnings are non-blocking — definitions with unresolved warnings can be saved but are marked
as incomplete in the picker.

#### Scenario: Impossible deck counts warned
- GIVEN a creator sets deck constraints that are logically impossible (e.g. minCards > maxCards)
- WHEN the creator views the editor
- THEN a warning panel lists the issue and the definition is saved with an `⚠ incomplete` badge in the picker

#### Scenario: Catalog too small warned
- GIVEN a creator has fewer cards in the catalog than the declared `minCards` value
- WHEN the creator views the editor
- THEN a warning panel lists the size mismatch and the definition is marked incomplete in the picker

#### Scenario: Required-card cross-reference warned
- GIVEN a deck rule references a card ID that does not exist in the catalog
- WHEN the creator views the editor
- THEN a warning identifies the unknown required card ID

#### Scenario: Save blocked only on missing name
- GIVEN a definition has no name
- WHEN the creator attempts to save
- THEN the save button is disabled and an inline error indicates the name is required

#### Scenario: Warnings resolved and clean save succeeds
- GIVEN a creator has resolved all warnings (or the definition has none)
- WHEN the creator saves
- THEN the save succeeds, the definition persists, and no `⚠ incomplete` badge appears in the picker
