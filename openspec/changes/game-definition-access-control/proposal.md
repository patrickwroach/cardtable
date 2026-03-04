## Why

Game definitions are currently visible to all authenticated users. This is intentional for the MVP/development phase while no user model exists, but must be restricted before any production use. Creators should only see their own definitions; invited collaborators should see definitions they have been granted access to.

## What Changes

- Introduce a user identity model (at minimum: `displayName` associated with an anonymous or future authenticated UID).
- Filter `listGameDefinitions()` to return only definitions where `creatorId === currentUser.uid` OR `collaboratorIds` contains `currentUser.uid`.
- Add `collaboratorIds?: string[]` to `GameDefinition`.
- Add a sharing/invite flow in the Game Definition editor (invite by UID or link).
- Update Firestore security rules to enforce read access server-side.

## Capabilities

### New Capabilities
- `game-definition-sharing`: Invite collaborators to a game definition by UID or shareable link; collaborators can view and edit.

### Modified Capabilities
- `game-definition`: Access control requirement added — list and read are scoped to creator + collaborators.

## Impact

- `src/services/gameDefinitionService.ts` — `listGameDefinitions()` gains a `currentUserId` filter.
- `src/types/gameDefinition.ts` — `collaboratorIds?: string[]` added to `GameDefinition`.
- `firestore.rules` — add `request.auth.uid == resource.data.creatorId || request.auth.uid in resource.data.collaboratorIds` read rule for `gameDefinitions`.
- `src/components/GameDefinitionEditor.tsx` — sharing panel in editor header.
