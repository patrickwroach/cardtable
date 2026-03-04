# Delta: Room Lifecycle — Realtime Sync and Recovery

## ADDED Requirements

### Requirement: Realtime State Synchronisation
The system MUST synchronise room state updates to all connected clients in real time.

#### Scenario: Mutation visible to all clients
- GIVEN two clients are in the same room
- WHEN one client performs a valid mutation
- THEN both clients display the same resulting state within acceptable latency

### Requirement: Mutation Error Visibility
The system MUST surface explicit, actionable error messages when a mutation fails.

#### Scenario: Failed mutation notification
- GIVEN a mutation fails server-side
- WHEN the operation returns an error
- THEN the user sees a clear failure message with an actionable next step

### Requirement: Automatic Recovery after Disconnect
The system MUST attempt automatic re-subscription and state reconciliation after a transient disconnect.

#### Scenario: Reconnect reconciliation
- GIVEN a client experiences a short network disconnect
- WHEN connectivity returns
- THEN the client re-subscribes and reconciles to the latest server room state
- AND no local state corruption is introduced
