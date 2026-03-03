# Spec-Driven Development Guide

This folder defines a lightweight Spec-Driven Development (SDD) system for this repository.

## Goals

- Define requirements before implementation.
- Make design tradeoffs explicit.
- Tie implementation to measurable acceptance criteria.
- Keep planning, delivery, and QA artifacts in one place.

## Folder Structure

- `project/` — stable project-level context
  - `vision.md` — product goals, users, scope boundaries
  - `nfr.md` — non-functional requirements (performance, reliability, security)
  - `engineering-standards.md` — code quality bar and acceptable work gate
- `features/` — feature specs (`FEAT-###-name.md`)
- `adrs/` — architecture decision records (`ADR-####-title.md`)
- `qa/` — feature test plans (`TP-###-name.md`)
- `templates/` — reusable templates for all new work

## Standard Document Set

For each meaningful feature, create and maintain these documents:

1. Feature Spec (`features/FEAT-###-name.md`)
2. Optional ADR (`adrs/ADR-####-title.md`) when design tradeoffs matter
3. Test Plan (`qa/TP-###-name.md`)
4. Release Checklist entry (`templates/release-checklist.template.md` copied into PR description or release doc)

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
