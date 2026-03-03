# FEAT-001: Game Room Lifecycle

## Status

Approved

## Owner

Project Maintainer

## Problem Statement

Players need a fast, reliable way to create and join game rooms, start a game, and perform core card interactions with synchronized state.

## User Story

As a player, I want to create or join a room and play cards in real time, so that I can play remotely with others.

## Scope

### In Scope

- Create game room.
- Join game room by ID.
- Host starts game.
- Player draws card.
- Player plays card.
- Real-time updates to all connected players.

### Out of Scope

- Advanced game rules/turn logic.
- Matchmaking and public lobby browser.
- Persistent user accounts.

## Functional Requirements

- FR-1: User can create a room and become host.
- FR-2: User can join an existing room with valid room ID.
- FR-3: Host can start game from waiting state.
- FR-4: Players can draw from deck while cards remain.
- FR-5: Players can play a card from their hand.
- FR-6: UI reflects current game state changes in near real-time.

## Acceptance Criteria

- AC-1: Given a user enters a name and creates game, when creation succeeds, then a game ID is displayed and room state is visible.
- AC-2: Given another user enters same game ID and name, when join succeeds, then both users see updated player list.
- AC-3: Given host is in waiting state, when host starts game, then game status becomes `playing` for all players.
- AC-4: Given a player clicks draw with non-empty deck, when operation succeeds, then deck count decrements and hand count increments.
- AC-5: Given a player clicks a card in their hand, when operation succeeds, then card is removed from hand and appears in played cards.
- AC-6: Given backend failure, when an operation fails, then user sees a clear error and can return to lobby.

## Edge Cases

- Invalid or non-existent room ID on join.
- Draw when deck is empty.
- Play card not present in local hand.
- Temporary network failure during state mutation.

## Dependencies

- Firebase Firestore availability and valid config.
- Client connectivity for realtime subscriptions.

## Data / API Notes

- Game document fields: `players`, `deck`, `playedCards`, `status`, `hostId`.
- Primary operations in service layer:
  - `createGame`
  - `joinGame`
  - `startGame`
  - `drawCardFromDeck`
  - `playCard`
  - `subscribeToGame`

## Risks

- Race conditions on simultaneous updates.
- Firestore rules not restrictive enough.

## Rollout Plan

1. Validate Firebase config and rules in non-prod.
2. Run lint/build and manual smoke checks.
3. Release and monitor error logs.

## Open Questions

- Should start game require minimum player count?
- Should draw/play be gated by turn ownership?

## Traceability

- Implementation PR(s): TBD
- Test plan: `docs/specs/qa/TP-001-game-room-lifecycle.md`
- ADR(s): `docs/specs/adrs/ADR-0001-nextjs-app-router-migration.md`
