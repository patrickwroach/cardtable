# Engineering Standards and Acceptable Work

## Purpose

Define a clear quality bar for implementation work so feature delivery is consistent, testable, and maintainable.

## General Code Guidelines

- Keep changes small and focused to the active feature.
- Prefer clear, explicit code over clever abstractions.
- Avoid introducing new dependencies unless there is clear value.
- Keep naming domain-oriented and consistent with existing code.
- Handle expected failure paths explicitly (input, network, and persistence errors).

## TypeScript and React Expectations

- Keep strict typing for public interfaces and service-layer contracts.
- Avoid `any`; if unavoidable, isolate and document the boundary.
- Keep React components focused: presentational concerns separated from service/data concerns when practical.
- Prefer pure utility functions for game-rule logic to improve testability.

## Frontend and React Rules

### Component Design

- Keep components small and single-purpose; split when a component handles unrelated concerns.
- Prefer composition over deep prop drilling; extract shared UI patterns into reusable components.
- Co-locate component-specific styles/tests/helpers with the component when practical.
- Keep display components free of direct Firebase/service calls when possible.

### State Management

- Keep state as local as possible; lift state only when multiple children require shared ownership.
- Use derived values instead of duplicating state.
- Use `useMemo`/`useCallback` only when there is a real render or dependency-cost reason.
- Avoid mutating state objects/arrays directly; always use immutable updates.

### Effects and Data Fetching

- Use `useEffect` only for side effects (subscriptions, timers, network orchestration).
- Ensure every effect has correct dependency lists and cleanup logic.
- Guard against race conditions in async effects (stale response handling/cancel patterns).
- Keep data-fetching and realtime-subscription logic in service hooks/utilities where practical.

### Forms and Validation

- Validate user input before submit and show field-level errors when possible.
- Disable submit actions while requests are in-flight to prevent duplicate writes.
- Keep validation messages short, specific, and actionable.

### Accessibility and UX

- Use semantic HTML first (`button`, `label`, `form`, headings in order).
- Ensure keyboard accessibility for all interactive elements.
- Provide visible focus states and sufficient text contrast.
- All inputs must have associated labels; icon-only buttons need accessible names.

### Styling and UI Consistency

- Reuse existing design tokens/components before adding new UI patterns.
- Avoid one-off visual overrides that break consistency across screens.
- Keep responsive behavior functional at common desktop and mobile widths.
- Use Tailwind as the default styling approach and extend Tailwind theme tokens before adding ad-hoc CSS values.
- Use stylesheet classes for reusable or complex styles that are awkward in utilities.
- Use inline style only for dynamic values that cannot be expressed cleanly with utilities/classes.
- Manage theme values through Tailwind theme tokens/custom properties wherever possible.
- For component-level styles, default to CSS custom properties to handle stateful/dynamic values (interaction states, computed offsets, animation inputs) when standard utilities are insufficient.
- Use BEM naming for authored stylesheet classes to keep structure consistent and readable.

#### Example (Preferred vs Avoid)

Preferred:

- Use utility classes for layout, spacing, typography, and standard states.
- Define interaction-specific values via component-scoped CSS custom properties when utilities are insufficient.
- Source custom-property values from theme tokens (not hard-coded values).

Example pattern:

- Base styles: utility classes (`layout`, `spacing`, `type`, `radius`, `transition`).
- Dynamic state value: set `--component-interaction-bg` from a theme token.
- Stateful rule: use `background: var(--component-interaction-bg)` in the component stylesheet.

Avoid:

- Hard-coded one-off colors in inline styles when the value should come from theme tokens.
- Large custom CSS blocks for layout/spacing that Tailwind utilities already handle.

### Performance Baseline

- Avoid unnecessary re-renders from unstable inline objects/functions in hot paths.
- Virtualize or paginate large lists when rendering cost is noticeable.
- Lazy-load non-critical UI/code paths where it meaningfully reduces initial load.

## Firebase and Data Safety

- Do not trust client input for critical state transitions.
- Validate payload shape before writes.
- Ensure Firestore updates do not silently fail.
- Keep security rules aligned with current feature behavior.

## UX Quality Baseline

- Loading, empty, and error states are required for user-facing flows.
- Error messages should be actionable and non-technical.
- Avoid blocking user progress without clear recovery steps.

## Testing and Verification Requirements

- Every implemented FEAT must map to at least one TP execution note.
- Validate happy path + one error path + one edge case.
- Run `npm run lint:all` and `npm run build` before marking work complete.
- For realtime/session features, perform at least one multi-client manual check.

## Documentation Requirements

- Keep FEAT status and scope current when implementation changes.
- Update TP evidence section with commands and manual notes.
- Add ADR when architecture or data-model decisions are non-trivial.

## Acceptable Work Gate (Definition of Acceptable)

Work is acceptable only if all are true:

- Scope: Implements only the approved FEAT scope (or explicitly records scope changes).
- Correctness: Acceptance criteria are demonstrably satisfied.
- Quality: Lint/build pass and key error paths handled.
- Safety: No known critical security/data-integrity regressions introduced.
- Verification: TP scenarios and evidence are recorded.
- Handoff: Follow-ups/known limitations are documented.

## Pull Request / Change Checklist (Copy/Paste)

- [ ] FEAT scope confirmed and unchanged (or updated in spec).
- [ ] Acceptance criteria verified.
- [ ] `npm run lint:all` passes.
- [ ] `npm run build` passes.
- [ ] Happy path, error path, and edge case checked.
- [ ] Loading/empty/error UI states reviewed.
- [ ] React effects have correct dependencies and cleanup.
- [ ] Forms have validation and prevent duplicate submits.
- [ ] Keyboard/accessibility basics reviewed (labels, focus, semantics).
- [ ] Firebase/data writes validated for safety.
- [ ] TP evidence updated.
- [ ] ADR added if design tradeoff was made.
- [ ] Known limitations and follow-ups captured.
