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
import { Components } from "../../store/components.js";
import { ResourceComponents } from "../../store/resource-components.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { TransactionResult } from "../transactional-store/index.js";
import { TransactionWriteOperation } from "../transactional-store/transactional-store.js";
import { Store } from "../../store/index.js";
import { Entity } from "../../entity.js";

export type ReconcilingEntry<
    C extends Components = Components,
    R extends ResourceComponents = ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>> = ArchetypeComponents<StringKeyof<C>>,
> = {
    readonly id: number;
    readonly name: string;
    readonly transaction: (store: Store<C, R, A>, args: unknown) => void | Entity;
    readonly args: unknown;
    readonly time: number;
    result?: TransactionResult<C>;
};

export const ReconcilingEntryOps = {
    isTransient<
        C extends Components,
        R extends ResourceComponents,
        A extends ArchetypeComponents<StringKeyof<C>>
    >(entry: ReconcilingEntry<C, R, A>): boolean {
        return entry.time < 0;
    },
    compare<
        C extends Components,
        R extends ResourceComponents,
        A extends ArchetypeComponents<StringKeyof<C>>
    >(a: ReconcilingEntry<C, R, A>, b: ReconcilingEntry<C, R, A>): number {
        const absDiff = Math.abs(a.time) - Math.abs(b.time);
        if (absDiff !== 0) {
            return absDiff;
        }
        const idDiff = a.id - b.id;
        if (idDiff !== 0) {
            return idDiff;
        }
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    },
    findInsertIndex<
        C extends Components,
        R extends ResourceComponents,
        A extends ArchetypeComponents<StringKeyof<C>>
    >(entries: ReconcilingEntry<C, R, A>[], entry: ReconcilingEntry<C, R, A>): number {
        let low = 0;
        let high = entries.length;
        while (low < high) {
            const mid = (low + high) >> 1;
            if (ReconcilingEntryOps.compare(entry, entries[mid]) < 0) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    },
};

export type SerializedReconcilingEntry = {
    readonly id: number;
    readonly name: string;
    readonly args: unknown;
    readonly time: number;
    readonly undo?: TransactionWriteOperation<any>[];
};

export const serializeReconcilingEntry = <
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>
>(
    entry: ReconcilingEntry<C, R, A>,
): SerializedReconcilingEntry => ({
    id: entry.id,
    name: entry.name,
    args: entry.args,
    time: entry.time,
    undo: entry.result?.undo as TransactionWriteOperation<any>[] | undefined,
});

export const deserializeReconcilingEntry = <
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>
>(
    serialized: SerializedReconcilingEntry,
    transaction: (store: Store<C, R, A>, args: unknown) => void | Entity,
): ReconcilingEntry<C, R, A> => {
    const undoOperations = Array.isArray(serialized.undo)
        ? (serialized.undo as TransactionWriteOperation<C>[])
        : undefined;

    return {
        id: Number(serialized.id),
        name: serialized.name,
        transaction,
        args: serialized.args,
        time: serialized.time,
        result: undoOperations
            ? {
                value: undefined,
                transient: serialized.time < 0,
                undoable: null,
                redo: [],
                undo: undoOperations,
                changedEntities: new Map(),
                changedComponents: new Set(),
                changedArchetypes: new Set(),
            }
            : undefined,
    };
};

