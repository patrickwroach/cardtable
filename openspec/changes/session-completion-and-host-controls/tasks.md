# Tasks: Session Completion and Host Controls

## 1. Terminal State Transitions
- [ ] 1.1 Implement `evaluateEndCondition(roomId)` — read win conditions, test against room state
- [ ] 1.2 Call `evaluateEndCondition` at the end of every gameplay mutation
- [ ] 1.3 Implement `completeSession(roomId, winner, endReason)` — atomic write of `status: complete`
- [ ] 1.4 Add post-terminal guard to all mutation services: reject writes when `status === complete`

## 2. End-Game Display
- [ ] 2.1 Show end-game screen when room `status` becomes `complete`
- [ ] 2.2 Display winner and end reason to all clients
- [ ] 2.3 Confirm action controls are disabled in terminal state

## 3. Host Force-End
- [ ] 3.1 Implement `forceEndSession(roomId)` service call
- [ ] 3.2 Add force-end button visible only to host in active sessions
- [ ] 3.3 Require explicit confirmation step before calling `forceEndSession`
- [ ] 3.4 Verify all clients receive terminal state after host force-end

## 4. Verification
- [ ] 4.1 Run `npm run lint` and `npm run build` — no errors
- [ ] 4.2 End-condition test: trigger win condition, confirm all clients show end screen
- [ ] 4.3 Post-terminal action test: attempt gameplay mutation after completion, confirm rejection
- [ ] 4.4 Force-end test: host force-ends stalled session, all clients see terminal state
- [ ] 4.5 Max-players test: create a Pinochle room (max 4), attempt a 5th join, confirm error "Room is full"
- [ ] 4.6 Min-players test: create a Pinochle room (min 4) with only 1 player, attempt Start, confirm error "Need at least 4 players"
