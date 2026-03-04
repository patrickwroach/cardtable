# Delta: Game Definition — Card Catalog and Deck Constraints

## ADDED Requirements

### Requirement: Card Authoring
The system MUST allow a creator to create, edit, and delete card definitions.

#### Scenario: Valid card/deck saved
- GIVEN a creator has defined cards and deck rules that satisfy all constraints
- WHEN the creator saves the definition
- THEN the definition persists and is available for session use

### Requirement: Deck Constraint Authoring
The system MUST allow a creator to define deck limits and required cards.

#### Scenario: Deck rules editable
- GIVEN a creator opens the deck rules editor
- WHEN the creator sets min/max counts and required card IDs
- THEN those values are stored on the definition and included in the next save

### Requirement: Card and Deck Validation
The system MUST validate card and deck consistency before saving and block saves with violations.

#### Scenario: Duplicate card ID blocked
- GIVEN a creator adds a card with an ID that already exists in the catalog
- WHEN the creator attempts to save
- THEN the save is blocked with an explicit, field-level error identifying the duplicate

#### Scenario: Invalid deck counts blocked
- GIVEN a creator sets deck constraints that are logically impossible (e.g. minCards > maxCards)
- WHEN the creator attempts to save
- THEN the save is blocked with an actionable error message

#### Scenario: Validation resolved and save succeeds
- GIVEN a creator has fixed all validation errors
- WHEN the creator retries the save
- THEN the save succeeds and the definition persists
