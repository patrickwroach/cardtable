# TP-009: Definition Import/Export and Validation Test Plan

## Scope

Validates acceptance criteria in `FEAT-009-definition-import-export-and-validation.md`.

## Test Types

- Unit: JSON parse/schema version checks.
- Integration: export/import round-trip and failure handling.
- Manual E2E: creator import/export workflow and recovery UX.

## Scenarios

1. Happy path: export valid definition and import round-trip preserves state.
2. Validation/error path: malformed JSON and unsupported version are blocked.
3. Edge cases: partial payloads and oversized definitions.

## Test Data

- Valid full-definition fixture
- Malformed JSON fixture
- Unsupported schema-version fixture

## Environment

- Local: `npm run dev`
- Staging: pre-release smoke

## Exit Criteria

- All P0/P1 scenarios pass.
- No unresolved critical defects.

## Evidence

- Command output
- Manual notes/screenshots
