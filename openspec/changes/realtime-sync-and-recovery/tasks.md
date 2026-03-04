# Tasks: Realtime Sync and Recovery

## 1. Subscription Hardening
- [ ] 1.1 Audit `subscribeToGame` for unhandled error paths
- [ ] 1.2 Add `onError` callback to subscription — surface connection failures to UI
- [ ] 1.3 Ensure subscription cleanup (unsubscribe) runs on component unmount

## 2. Mutation Error Handling
- [ ] 2.1 Implement `handleMutationError` — map Firestore errors to user-facing messages
- [ ] 2.2 Wrap all Firestore write calls with the error handler
- [ ] 2.3 Display error message in UI with a clear recovery cue

## 3. Reconnect and Reconciliation
- [ ] 3.1 Implement `resubscribeToGame` — tear down old listener, re-establish fresh subscription
- [ ] 3.2 Detect connectivity change (navigator.onLine or Firestore network events)
- [ ] 3.3 Trigger `resubscribeToGame` on reconnect event
- [ ] 3.4 Confirm first snapshot post-reconnect is treated as server-authoritative state

## 4. Verification
- [ ] 4.1 Multi-client test: one client performs mutation, confirm both see same result
- [ ] 4.2 Simulated failure: block network mid-session, confirm error message appears
- [ ] 4.3 Throttled-network test: reconnect, confirm state reconciles to server truth
