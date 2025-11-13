/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

import { TransactionResult, TransactionWriteOperation } from "./transactional-store.js";
import { equals } from "../../../equals.js";

/**
 * Determines if two adjacent transaction results should be coalesced.
 * Transactions are coalesced when they have structurally equal coalesce values,
 * and neither has coalesce: false.
 */
export function shouldCoalesceTransactions(
    previous: TransactionResult<any>,
    current: TransactionResult<any>
): boolean {
    return !!previous.undoable &&
        !!current.undoable &&
        current.undoable.coalesce !== false &&
        previous.undoable.coalesce !== false &&
        equals(current.undoable.coalesce, previous.undoable.coalesce);
}

/**
 * Coalesces arrays of write operations, potentially merging and removing redundant operations.
 */
function coalesceWriteOperations(operations: TransactionWriteOperation<any>[]): TransactionWriteOperation<any>[] {
    if (operations.length <= 1) return operations;

    // Simple approach: just merge consecutive update operations on the same entity
    const result: TransactionWriteOperation<any>[] = [];
    let i = 0;

    while (i < operations.length) {
        const current = operations[i];

        // Look ahead to see if we can merge with next operations
        if (current.type === "update") {
            const mergedValues = { ...current.values };
            let j = i + 1;

            // Merge consecutive updates on the same entity
            while (j < operations.length &&
                operations[j].type === "update") {
                const nextOp = operations[j];
                if (nextOp.type === "update" && nextOp.entity === current.entity) {
                    Object.assign(mergedValues, nextOp.values);
                    j++;
                } else {
                    break;
                }
            }

            if (j > i + 1) {
                // We merged some operations
                result.push({
                    type: "update",
                    entity: current.entity,
                    values: mergedValues
                });
                i = j;
            } else {
                // No merging possible
                result.push(current);
                i++;
            }
        } else if (current.type === "insert") {
            // Look ahead for updates to merge into this insert
            const mergedValues = { ...current.values };
            let j = i + 1;
            let hasUpdates = false;

            while (j < operations.length && operations[j].type === "update") {
                const nextOp = operations[j];
                if (nextOp.type === "update") {
                    Object.assign(mergedValues, nextOp.values);
                    hasUpdates = true;
                }
                j++;
            }

            if (hasUpdates) {
                result.push({
                    type: "insert",
                    values: mergedValues
                });
                i = j;
            } else {
                result.push(current);
                i++;
            }
        } else {
            // For delete operations, check if we can cancel with previous insert
            if (current.type === "delete" && result.length > 0 && result[result.length - 1].type === "insert") {
                // Cancel insert + delete
                result.pop();
                i++;
            } else {
                result.push(current);
                i++;
            }
        }
    }

    return result;
}

/**
 * Coalesces two adjacent transaction results into a single combined transaction.
 * The current transaction's operations are applied after the previous transaction's operations.
 */
export function coalesceTransactions(
    previous: TransactionResult<any>,
    current: TransactionResult<any>
): TransactionResult<any> {
    // Combine and coalesce redo operations (apply current after previous)
    const combinedRedo = coalesceWriteOperations([...previous.redo, ...current.redo]);

    // Combine and coalesce undo operations (reverse order: undo current first, then previous)
    const combinedUndo = coalesceWriteOperations([...current.undo, ...previous.undo]);

    // Combine changed entities, components, and archetypes
    const combinedChangedEntities = new Map(previous.changedEntities);
    for (const [entity, values] of current.changedEntities) {
        combinedChangedEntities.set(entity, values);
    }

    const combinedChangedComponents = new Set(previous.changedComponents);
    for (const component of current.changedComponents) {
        combinedChangedComponents.add(component);
    }

    const combinedChangedArchetypes = new Set(previous.changedArchetypes);
    for (const archetype of current.changedArchetypes) {
        combinedChangedArchetypes.add(archetype);
    }

    // Create combined transaction result
    return {
        value: current.value,
        transient: current.transient,
        undoable: current.undoable,
        redo: combinedRedo,
        undo: combinedUndo,
        changedEntities: combinedChangedEntities,
        changedComponents: combinedChangedComponents,
        changedArchetypes: combinedChangedArchetypes,
    };
} 