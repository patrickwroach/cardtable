# Release Checklist

## Spec Completeness

- [ ] Feature spec is Approved.
- [ ] Acceptance criteria are testable and complete.
- [ ] ADR exists for non-trivial design decisions.

## Implementation Quality

- [ ] Lint/build pass.
- [ ] React Doctor diagnostics pass.
- [ ] Error handling and empty/loading states reviewed.
- [ ] Security-sensitive paths reviewed (auth/rules/config).
- [ ] Scope remains within approved FEAT (or spec updated).
- [ ] No `any`-driven contract gaps in core service/model paths.

## Validation

- [ ] Test plan executed.
- [ ] Happy path + one error path + one edge case verified.
- [ ] Regressions checked in adjacent flows.
- [ ] Manual smoke test completed.

## Launch

- [ ] Release notes drafted.
- [ ] Rollback approach documented.
- [ ] Follow-up tasks captured.

## Acceptable Work Gate

- [ ] Acceptance criteria demonstrably satisfied.
- [ ] Data integrity/security risks reviewed as non-critical.
- [ ] Evidence captured in TP notes and linked in change record.
