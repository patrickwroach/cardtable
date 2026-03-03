# Project Vision

## Product

Card Game Platform — a real-time multiplayer web app where players can create and join game rooms and play card interactions live.

## Primary Users

- Casual players hosting games with friends.
- Players joining by shared game ID.

## Core Outcomes

- Create and join game sessions quickly.
- Keep game state synchronized across clients.
- Provide clear game state visibility (deck, played cards, player hands).

## Scope (Current)

- Real-time room lifecycle: create, join, start, play basic turns.
- Firebase-backed shared game state.
- Browser-based UI with Next.js + React.

## Out of Scope (Current)

- Authentication beyond lightweight player identity.
- Matchmaking/lobbies with discovery.
- Multi-game rules engine beyond current base interactions.

## Success Indicators

- Players can start a game in under 60 seconds.
- State updates are visible to all players within acceptable latency.
- Error states are understandable and recoverable.
