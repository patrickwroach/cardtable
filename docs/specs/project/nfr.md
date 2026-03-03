# Non-Functional Requirements (NFR)

## Performance

- Initial page load targets modern desktop browsers used for internal testing.
- Typical room actions (join/start/draw/play/end-turn) should appear near-real-time for connected users.

## Reliability

- Client handles transient Firebase failures with user-friendly recovery messages.
- No silent state mutation failures for creator configuration save/load or tester room actions.
- Realtime subscriptions recover cleanly after short network interruptions where feasible.

## Security

- Firebase credentials/config are environment-appropriate and not placeholder values in production.
- Firestore rules must enforce valid game updates by participant role.

## Cost Efficiency

- Default architecture and feature choices prioritize very low or zero recurring cost during prototype phase.
- Avoid introducing paid infrastructure unless there is a clear, documented need.

## Maintainability

- New features include Feature Spec + Test Plan.
- Non-trivial architectural changes include ADR.
- Creator rule/card configuration model should be documented to support iterative rule changes.

## Observability

- Console errors are descriptive during development.
- Production telemetry/logging strategy should be introduced before public launch.
