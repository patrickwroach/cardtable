# Design: Definition Import/Export and Validation

## Technical Approach

Export serialises the in-memory game definition state to a formatted JSON blob with a
`schemaVersion` field added by the exporter. The user downloads it as a `.json` file via
a browser download trigger. Import reads the selected file, parses JSON, runs
`validateGameDefinition`, and — if valid — replaces the editor state. On failure, the
current draft is left unchanged and errors are surfaced.

## Architecture Decisions

### Decision: Client-side import/export only in v1
No server-side storage or cloud function round-trip. All serialisation happens in the
browser. Simpler and sufficient for the prototype.

### Decision: Schema version pinned in exporter
The exporter stamps `schemaVersion` automatically. Importers check this field against
the list of supported versions before further validation.

## Export Shape

```json
{
  "schemaVersion": "1.0",
  "cards": [...],
  "deckRules": { ... },
  "turnPhases": [...],
  "winConditions": [...]
}
```

## APIs

| API | Purpose |
|---|---|
| `exportGameDefinition(definition)` | Serialise to JSON string with schemaVersion |
| `importGameDefinition(jsonString)` | Parse + validate + return editor-ready state |
| `validateGameDefinition(definition)` | Full schema check; returns array of errors |

## File Changes

- `src/services/gameDefinitionService.ts` — add `exportGameDefinition`, `importGameDefinition`, `validateGameDefinition`
- `src/types/gameDefinition.ts` — add `schemaVersion` field
- `src/components/` — import/export UI buttons and error display
