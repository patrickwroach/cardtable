# Project Documentation

This folder contains stable project-level context that applies across all feature work.
Active feature specs, design artifacts, and implementation tasks live in `openspec/`.

## Folder Structure

- `project/` — project-level context (does not change with individual features)
  - `vision.md` — product goals, users, scope boundaries
  - `nfr.md` — non-functional requirements (performance, reliability, security)
  - `engineering-standards.md` — code quality bar and acceptable work gate
- `adrs/` — architecture decision records (`ADR-####-title.md`)

## Feature Work Lives in OpenSpec

All active and completed feature specs are managed through OpenSpec in the `openspec/` directory at the project root.
See `.github/copilot-instructions.md` for the full workflow, slash commands, and active changes.

## Recommended Workflow

1. **Frame**: confirm problem statement and user outcome in feature spec.
2. **Specify**: write acceptance criteria and edge cases.
3. **Design**: add ADR if architecture/API/data model decisions are non-trivial.
4. **Build**: implement against spec requirements.
5. **Verify**: execute test plan; record evidence.
6. **Release**: use checklist and note follow-ups.

## Definition of Done (Spec-Driven)

A feature is done only when:

- Acceptance criteria pass.
- Relevant tests are written/run and recorded.
- Any architecture decision is captured in ADR.
- Known risks and follow-ups are documented.

See `project/engineering-standards.md` for implementation quality expectations and the Acceptable Work Gate.

## Solo Build Checklist

Use this as the single source of truth for implementation order.

### Now

- [ ] FEAT-007: Card Catalog and Deck Constraints
- [ ] FEAT-003: Room Access and Session Bootstrap

### Next

- [ ] FEAT-008: Rules and Win Conditions
- [ ] FEAT-004: Turn and Phase Orchestration
- [ ] FEAT-006: Session Completion and Host Controls
- [ ] FEAT-009: Definition Import/Export and Validation

### Later

- [ ] FEAT-005: Realtime Sync and Recovery
