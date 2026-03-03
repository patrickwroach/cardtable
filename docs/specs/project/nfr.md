# Non-Functional Requirements (NFR)

## Performance

- Initial page load targets modern desktop/mobile browsers.
- Typical game actions (draw/play) should appear near-real-time for connected users.

## Reliability

- Client handles transient Firebase failures with user-friendly errors.
- No silent state mutation failures for core actions.

## Security

- Firebase credentials/config are environment-appropriate and not placeholder values in production.
- Firestore rules must enforce valid game updates by participant role.

## Maintainability

- New features include Feature Spec + Test Plan.
- Non-trivial architectural changes include ADR.

## Observability

- Console errors are descriptive during development.
- Production telemetry/logging strategy should be introduced before public launch.
