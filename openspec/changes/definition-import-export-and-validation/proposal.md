# Proposal: Definition Import/Export and Validation

## Intent

Creators need a portable, validated format for sharing game definitions across
environments and team members. Without it, definitions are locked to one instance and
cannot be reused or iterated safely.

## Delivery Phase

MVP-now

## Scope

**In scope:**
- Export full game definition JSON
- Import game definition JSON
- Validate schema version and required fields on import
- Preserve existing draft on failed import

**Out of scope:**
- Collaborative merge/conflict tooling
- Automatic multi-version migration framework

## Approach

Export serialises the full definition (cards, deckRules, turnPhases, winConditions, schemaVersion)
to a downloadable JSON file. Import reads the file, runs schema validation, and restores
the editor state if valid. A failed import leaves the current draft untouched.

## Dependencies

- `card-catalog-and-deck-constraints` and `rules-and-win-conditions` must define their
  schemas so the export shape is complete

## Risks

- Weak schema checks may permit invalid runtime configurations to be imported

## Open Questions

- Is one active schema version sufficient for the prototype phase?
