# Tasks: Room Access and Session Bootstrap

## 1. Room Creation
- [ ] 1.1 Implement `createGame` — generate code, write Firestore doc, set `hostId`
- [ ] 1.2 Generate shareable link from room ID
- [ ] 1.3 Display room code and share link on lobby screen
- [ ] 1.4 Show host indicator in lobby UI

## 2. Join by Code
- [ ] 2.1 Implement `joinGame(code)` — look up room by code, append player to roster
- [ ] 2.2 Add join-by-code form to lobby entry screen
- [ ] 2.3 Show error state for invalid or expired codes

## 3. Join by Link
- [ ] 3.1 Implement `joinGameByLink(linkId)` — resolve link to room ID, then join
- [ ] 3.2 Parse link param on lobby page load and auto-trigger join

## 4. Roster Display
- [ ] 4.1 Subscribe to room document via `subscribeToGame`
- [ ] 4.2 Render live player list with waiting status indicator
- [ ] 4.3 Show loading state before first subscription event

## 5. Session Start
- [ ] 5.1 Implement `startGame(roomId)` — conditional write: `waiting` → `active`
- [ ] 5.2 Render start button for host only; disable for non-hosts
- [ ] 5.3 Enforce precondition check (minimum player count) before enabling start
- [ ] 5.4 Verify all connected clients transition out of waiting on start

## 6. Verification
- [ ] 6.1 Run `npm run lint` and `npm run build` — no errors
- [ ] 6.2 Multi-client manual check: two browser tabs, same roster state
- [ ] 6.3 Invalid code smoke test: confirm error message is shown
