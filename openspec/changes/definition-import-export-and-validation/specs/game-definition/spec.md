# Delta: Game Definition — Definition Import/Export and Validation

## ADDED Requirements

### Requirement: Definition Export
The system MUST export the full game definition as a downloadable JSON file including schema version metadata.

#### Scenario: Export includes all sections
- GIVEN a creator has a valid game definition open in the editor
- WHEN the creator triggers export
- THEN the downloaded JSON includes cards, deckRules, turnPhases, winConditions, and schemaVersion

### Requirement: Definition Import
The system MUST import a valid game definition JSON file and restore the editable editor state.

#### Scenario: Valid import restores state
- GIVEN a creator selects a previously exported valid JSON file
- WHEN the import completes
- THEN the editor reflects the same cards, rules, and win conditions as the original

### Requirement: Import Validation and Draft Preservation
The system MUST block imports with invalid JSON or unsupported schema versions and preserve the current draft on failure.

#### Scenario: Malformed JSON blocked
- GIVEN a creator selects a file with malformed or unparseable JSON
- WHEN the import is attempted
- THEN the import is blocked with an error message
- AND the existing draft is unchanged

#### Scenario: Unsupported schema version blocked
- GIVEN a creator selects a file with an unrecognised schemaVersion
- WHEN the import is attempted
- THEN the import is blocked with an actionable error identifying the version mismatch
- AND the existing draft is unchanged
