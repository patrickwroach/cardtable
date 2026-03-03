# Project Vision

## Product

Card Game Platform — a web app for rapid game iteration where creators define game configuration (cards + rules) and testers run live multiplayer sessions to validate gameplay.

## Primary Users

- Game creators (designers) who configure game definitions.
- Game testers who join shared test rooms and play a session to completion.

## Core Outcomes

- Let creators define and export a playable game configuration quickly.
- Let testers join by code/link and complete a live session with synchronized state.
- Keep the platform lightweight and low-cost for internal prototyping.

## Scope (Current)

- Creator configuration for:
	- card definitions (name/type/effects),
	- deck composition limits,
	- turn/phase rules,
	- win conditions,
	- import/export of game configuration JSON.
- Tester room lifecycle: create/join by code or link, host starts session, play through to completion.
- Firebase-backed realtime shared game state.
- Browser-based UI with Next.js + React.

## Out of Scope (Current)

- Public matchmaking/discovery and social lobby features.
- Heavy analytics pipeline (tester feedback is gathered offline).
- Complex account/permissions system beyond minimal internal usage.

## Success Indicators

- Creators can produce a valid game configuration and export it without engineer intervention.
- Testers can join a room and complete a full test session from start to game end.
- Team can repeatedly run test sessions at minimal operational cost.
