/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

import { StringKeyof } from "../../../types/types.js";
import { TransactionResult } from "../transactional-store/index.js";
import { applyOperations } from "../transactional-store/apply-operations.js";
import { TransactionDeclarations } from "../database.js";
import { ResourceComponents } from "../../store/resource-components.js";
import { Store } from "../../store/index.js";
import { Components } from "../../store/components.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { ReconcilingDatabase, TransactionEnvelope } from "./reconciling-database.js";
import {
    ReconcilingEntry,
    ReconcilingEntryOps,
    SerializedReconcilingEntry,
    serializeReconcilingEntry,
    deserializeReconcilingEntry,
} from "./reconciling-entry.js";
import { createObservedDatabase } from "../observed/create-observed-database.js";
import { Entity } from "../../entity.js";

type SerializedReconcilingDatabaseState = {
    readonly store: unknown;
    readonly appliedEntries?: SerializedReconcilingEntry[];
};

export function createReconcilingDatabase<
    const C extends Components,
    const R extends ResourceComponents,
    const A extends ArchetypeComponents<StringKeyof<C>>,
    const TD extends TransactionDeclarations<C, R, A>
>(
    store: Store<C, R, A>,
    transactionDeclarations: TD,
    options: {
        /**
         * Maximum time in milliseconds to keep committed entries for reordering.
         * Entries older than the most recent entry by this amount will be pruned.
         * Default: 5000ms
         */
        maxSynchronizeDurationMs?: number;
    } = {},
): ReconcilingDatabase<C, R, A, TD> {
    const { maxSynchronizeDurationMs = 5000 } = options;
    type TransactionName = Extract<keyof TD, string>;

    const observedDatabase = createObservedDatabase(store);
    const {
        execute,
        observe,
        resources,
        toData: observedToData,
        fromData: observedFromData,
        ...storeMethods
    } = observedDatabase;

    const reconcilingEntries: ReconcilingEntry<C, R, A>[] = [];

    const rollbackRange = (startIndex: number) => {
        for (let i = reconcilingEntries.length - 1; i >= startIndex; i--) {
            const entry = reconcilingEntries[i];
            if (entry.result) {
                execute(t => applyOperations(t, entry.result!.undo), { transient: true });
                entry.result = undefined;
            }
        }
    };

    const replayRange = (startIndex: number) => {
        let lastResult: TransactionResult<C> | undefined;
        for (let i = startIndex; i < reconcilingEntries.length; i++) {
            const entry = reconcilingEntries[i];
            const result = execute(t => entry.transaction(t, entry.args), { transient: ReconcilingEntryOps.isTransient(entry) });
            
            // Only store result if it actually made changes (not a no-op)
            // A no-op transaction has empty redo/undo operations
            const isNoOp = result.redo.length === 0 && result.undo.length === 0;
            if (!isNoOp) {
                entry.result = result;
            } else {
                // For no-ops, don't store a result - this prevents it from being rolled back
                entry.result = undefined;
            }
            
            // Always track the last result (even if no-op) for return value
            lastResult = result;
        }
        return lastResult;
    };

    const pruneCommittedEntries = (mostRecentEntryTime: number) => {
        // Only prune committed entries that are too old to be reordered.
        // We keep entries within the synchronization window relative to the most recent entry.
        // This matches action-ecs behavior where pruning is based on the newest action time.
        const pruneThreshold = Math.abs(mostRecentEntryTime) - maxSynchronizeDurationMs;
        
        while (reconcilingEntries.length > 0) {
            const entry = reconcilingEntries[0];
            // Only prune committed entries (positive time) that are older than the threshold
            if (entry.time > 0 && Math.abs(entry.time) < pruneThreshold) {
                reconcilingEntries.shift();
            } else {
                break;
            }
        }
    };

    const applyEnvelope = (envelope: TransactionEnvelope<TransactionName>): TransactionResult<C> | undefined => {
        const transaction = transactionDeclarations[envelope.name];
        if (!transaction) {
            throw new Error(`Unknown transaction: ${envelope.name as string}`);
        }

        const isCancellation = envelope.time === 0;

        let startIndex = reconcilingEntries.length;

        const existingIndex = reconcilingEntries.findIndex(entry => entry.id === envelope.id);
        if (existingIndex >= 0) {
            startIndex = existingIndex;
            const existingEntry = reconcilingEntries[existingIndex];
            if (existingEntry.result) {
                execute(t => applyOperations(t, existingEntry.result!.undo), { transient: true });
                existingEntry.result = undefined;
            }
            reconcilingEntries.splice(existingIndex, 1);
        }

        if (isCancellation) {
            if (startIndex < reconcilingEntries.length) {
                rollbackRange(startIndex);
                replayRange(startIndex);
                // Use the most recent entry time for pruning (or 0 if no entries)
                const mostRecentTime = reconcilingEntries.length > 0 
                    ? Math.abs(reconcilingEntries[reconcilingEntries.length - 1].time)
                    : 0;
                pruneCommittedEntries(mostRecentTime);
            }
            return undefined;
        }

        const entry: ReconcilingEntry<C, R, A> = {
            id: envelope.id,
            name: envelope.name,
            transaction: transaction as (store: Store<C, R, A>, args: unknown) => void | Entity,
            args: envelope.args,
            time: envelope.time,
            result: undefined,
        };

        const insertIndex = ReconcilingEntryOps.findInsertIndex(reconcilingEntries, entry);
        // Calculate the rebuild index before inserting
        // For replacements: use min of old and new position to ensure we rebuild from earliest affected point
        // For new entries: startIndex is length, so rebuildIndex will be insertIndex
        const rebuildIndex = Math.min(startIndex, insertIndex);

        // Rollback everything from the rebuild point BEFORE inserting the new entry
        // This is clearer than rolling back after insert (which would iterate over the new entry unnecessarily)
        rollbackRange(rebuildIndex);
        
        // Now insert the new entry at the calculated position
        reconcilingEntries.splice(insertIndex, 0, entry);
        
        // Replay from the rebuild point, which now includes the newly inserted entry
        // This returns the result of the last replayed entry (which includes the newly inserted one)
        const latestResult = replayRange(rebuildIndex);
        
        // Prune old entries based on the newly applied entry's time
        pruneCommittedEntries(Math.abs(entry.time));

        // Return the result from replay (which may be a no-op with a value but no stored entry.result)
        return latestResult;
    };
    
    const cancelEntry = (id: number) => {
        const index = reconcilingEntries.findIndex(entry => entry.id === id);
        if (index === -1) {
            return;
        }
        rollbackRange(index);
        reconcilingEntries.splice(index, 1);
        replayRange(index);
    };

    const serializeReconcilingEntries = () =>
        reconcilingEntries
            .filter(entry => ReconcilingEntryOps.isTransient(entry))
            .map(entry => serializeReconcilingEntry(entry));

    const reconcilingDatabase: ReconcilingDatabase<C, R, A, TD> = {
        ...storeMethods,
        resources,
        execute,
        observe,
        toData: () => ({
            store: observedToData(),
            appliedEntries: serializeReconcilingEntries(),
        }),
        fromData: (data: unknown) => {
            let storeData: unknown = data;
            let serializedEntries: SerializedReconcilingEntry[] | undefined;

            if (typeof data === "object" && data !== null && "store" in (data as Record<string, unknown>)) {
                const payload = data as SerializedReconcilingDatabaseState;
                storeData = payload.store;
                serializedEntries = Array.isArray(payload.appliedEntries) ? payload.appliedEntries : undefined;
            }

            observedFromData(storeData);

            reconcilingEntries.length = 0;

            if (serializedEntries) {
                for (const serializedEntry of serializedEntries) {
                    const transaction = transactionDeclarations[serializedEntry.name as keyof TD];
                    if (!transaction) {
                        continue;
                    }
                    const entry = deserializeReconcilingEntry(
                        serializedEntry,
                        transaction as (store: Store<C, R, A>, args: unknown) => void | Entity,
                    );
                    reconcilingEntries.push(entry);
                }
                reconcilingEntries.sort(ReconcilingEntryOps.compare);
            }
        },
        apply: applyEnvelope,
        cancel: cancelEntry,
    };

    return reconcilingDatabase;
}

