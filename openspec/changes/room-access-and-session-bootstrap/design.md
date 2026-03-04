# Design: Room Access and Session Bootstrap

## Technical Approach

Room state lives in a Firestore document. Host is the creator. Players array is appended on
join. `startGame` performs a conditional write that transitions `status` from `waiting` to
`active`. Shareable links encode the room ID as a URL parameter.

## Architecture Decisions

### Decision: Firestore document per room
Each room is a single Firestore document. Simple to subscribe to, naturally scoped, and
supports the roster display without a secondary collection.

### Decision: Host role set at creation
`createdBy` field doubles as the host identifier. No role-transfer in v1.

## Data Model

| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `code` | string | 6-character join code |
| `status` | `waiting` \| `active` \| `complete` | Room lifecycle state |
| `hostId` | string | UID of creating player |
| `players` | Player[] | Current roster |

## APIs

| API | Purpose |
|---|---|
| `createGame` | Create room, set host, return code + shareable link |
| `joinGame(code)` | Add player to room by code |
| `joinGameByLink(linkId)` | Resolve link to room and join |
| `startGame(roomId)` | Transition room from `waiting` to `active` |
| `subscribeToGame(roomId)` | Realtime subscription to room document |

## File Changes

- `src/services/gameService.ts` — implement create/join/start
- `src/components/GameLobby.tsx` — waiting room UI with roster
- `src/components/GameRoom.tsx` — post-start room container
