# Proposal: Session Completion and Host Controls

## Intent

Test sessions need a clear terminal-state model and minimal host controls to avoid
stalled or ambiguous endings. Without this, test runs cannot close cleanly.

## Delivery Phase

MVP-now

## Scope

**In scope:**
- Detect and apply terminal session state
- Display winner/end reason to all clients
- Provide host force-end control for stalled sessions
- Prevent further gameplay mutations after terminal state

**Out of scope:**
- Post-game analytics and feedback capture
- Tournament/match history

## Approach

`evaluateEndCondition` runs after each gameplay mutation. On match, `completeSession`
sets `status: complete`, `winner`, and `endReason`. Host force-end triggers
`forceEndSession` with an explicit confirmation gate. Post-completion, all mutation
guards check `status === complete` and reject new actions.

## Dependencies

- `turn-and-phase-orchestration` must be in place to gate gameplay actions
- `rules-and-win-conditions` supplies the end-condition configuration

## Risks

- Premature session ending if end-condition evaluation is incorrect
- Host disconnect before force-end confirmation leaves session stalled

## Open Questions

- Should force-end assign a winner or only mark the session aborted?
