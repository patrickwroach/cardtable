# ADR-0001: Migrate Frontend Runtime from Vite SPA to Next.js App Router

- Status: Accepted
- Date: 2026-03-03
- Deciders: Project Maintainer

## Context

The project started as a Vite React SPA, but required a framework-standard app structure and stronger default conventions for routing, builds, and deployment workflows.

## Decision

Adopt Next.js App Router as the application runtime and build system.

## Consequences

### Positive

- Standardized app entry/layout model.
- Consistent production build/start workflow.
- Easier future expansion to server components/routes if needed.

### Negative / Tradeoffs

- Global CSS import rules required CSS import consolidation.
- Migration overhead from Vite-specific configs/files.

## Alternatives Considered

1. Keep Vite SPA — lower migration cost, but weaker project convention alignment for target workflow.
2. Migrate to another SSR framework — possible, but unnecessary complexity for current scope.

## Links

- Related feature spec: `docs/specs/features/FEAT-001-game-room-lifecycle.md`
- Related PR(s): local migration changes on 2026-03-03
