# Proposal: Card Catalog and Deck Constraints

## Intent

Creators need a reliable way to author cards and deck constraints so test sessions start
from a valid game definition. Without validated card/deck authoring, the runtime has no
content to work with.

## Delivery Phase

MVP-now

## Scope

**In scope:**
- Create/edit/delete card definitions
- Define deck composition rules (limits and required cards)
- Validate card/deck consistency before save

**Out of scope:**
- Turn/phase and win-condition modelling
- Import/export transport format

## Approach

Card definitions and deck rules are stored within the game definition document in Firestore.
`validateCardAndDeckRules` runs before every save and produces field-level errors when
constraints are violated. UI blocks save while validation errors exist.

## Dependencies

- `definition-import-export-and-validation` provides the schema and serialisation contracts
  that card/deck data must conform to

## Risks

- Validation complexity grows as deck rules expand in later phases

## Open Questions

- Minimum effect metadata required per card in v1?
