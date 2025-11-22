# Legacy Concurrency Checklist

## Ordering Behaviors
- Actions are sorted by `createdTime` ascending; ties break by `createdBy` (`compareActionOrder`).
- Transient actions are always ordered after non-transient ones at the same timestamp.
- Re-applying a past action (same `createdTime`/`createdBy`) replaces the existing entry rather than duplicating it.
- When an action inserts earlier in the timeline, later actions are rolled back and replayed in chronological order so final state reflects the sorted history.
- Sequential/async actions push transient updates for each yield; each transient update triggers a rollback + replay before applying new args.
- Only the final commit from a sequence (non-transient) remains; prior transient updates are discarded once the commit is applied.
- Cancelled actions (`type: "cancel"`) roll back their transient state and remove the pending action from the applied list.

## Rollback Behaviors
- Undo operations from prior commits are replayed in reverse order before reapplying with new ordering.
- Every transient yield or cancelled action performs a full rollback via the parent transaction before reapplying remaining actions.
- Any error during sequential execution cancels the sequence, rolls back to the pre-sequence state, and leaves no partial writes.
- When pruning old actions, only non-transient entries older than `maxSynchronizeDurationMs` are removed; pruning happens after successful apply.

## Required Data & Signals
- Signed `time` per envelope (`time < 0` transient, `time > 0` committed) with ordering derived from `Math.abs(time)` then `name`.
- Monotonically increasing local timestamps to ensure newly authored envelopes append after earlier ones.
- Monotonic `id` per logical transaction sequence so transient and commit envelopes replace one another.
- Persisted list of applied actions with their committed undo operations for rollback & replay.
- Flag indicating `transient`/`commit`/`cancel` to decide ordering and retention.
- Maximum synchronize window configuration to allow pruning (defaults to 5000ms).

## Gaps in New ECS
- `createTransactionalStore` currently replays only the most recent transaction, lacking timeline awareness or user identifiers.
- No persistent queue of applied transactions exists, so reordering and replay parity must be added.
- Transient iterations trigger rollback of the previous single transaction but do not yet reapply a sorted history of multiple overlapping commits.

