# Proposal: Rules and Win Conditions

## Intent

Creators need to define turn/phase rules and win conditions in a structured form so the
runtime can evaluate them consistently. Without this configuration layer, gameplay has
no rules and sessions cannot reach a conclusion.

## Delivery Phase

MVP-now

## Scope

**In scope:**
- Configure turn and phase model
- Configure phase transition conditions
- Configure win/end conditions used by runtime
- Validate rule consistency

**Out of scope:**
- Runtime transport/realtime behaviour
- Card/deck catalog management

## Approach

Turn phases are a sequence/graph of phase nodes stored in the game definition. Each phase
has a list of transition conditions (trigger expressions). Win conditions are a list of
state expressions. `validateRulesDefinition` checks for contradictory or unreachable states
before save.

## Dependencies

- `turn-and-phase-orchestration` consumes the phase/transition config at runtime
- `session-completion-and-host-controls` consumes the win conditions at runtime

## Risks

- Overly expressive rule model becomes hard to validate in v1

## Open Questions

- Should the phase model be strictly linear for v1?
