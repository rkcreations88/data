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

import { Observe } from "../../observe/index.js";
import { TransactionResult, TransactionWriteOperation } from "../database/transactional-store/transactional-store.js";
import { Database } from "../index.js";
import { shouldCoalesceTransactions, coalesceTransactions } from "../database/transactional-store/coalesce-transactions.js";
import { UndoRedoService } from "./undo-redo-service.js";

export const createUndoRedoService = (database: Database<any, any, any, { applyOperations: (operations: TransactionWriteOperation<any>[]) => void }>): UndoRedoService => {
    const undoStack: TransactionResult<any>[] = [];
    let stackIndex = 0;
    const [observeUndoStack, setObserveUndoStack] = Observe.createState<TransactionResult<unknown>[]>([]);
    const [observeStackIndex, setObserveStackIndex] = Observe.createState<number>(0);
    database.observe.transactions(t => {
        if (t.undoable && !t.transient) {
            // Check if we should coalesce with the previous transaction
            const shouldCoalesce = stackIndex > 0 && shouldCoalesceTransactions(undoStack[stackIndex - 1], t);

            if (shouldCoalesce) {
                // Coalesce: replace the previous transaction with a combined one
                const previousTransaction = undoStack[stackIndex - 1];
                const combinedTransaction = coalesceTransactions(previousTransaction, t);

                // Replace the previous transaction (stack index stays the same)
                undoStack[stackIndex - 1] = combinedTransaction;
            } else {
                // No coalescing: add as new transaction
                undoStack.length = stackIndex;
                undoStack.push(t);
                stackIndex++;
            }

            setObserveUndoStack([...undoStack]);
            setObserveStackIndex(stackIndex);
        }
    });
    const undoEnabled = Observe.withMap(observeStackIndex, (index) => index > 0);
    const redoEnabled = Observe.withMap(Observe.fromProperties({
        stack: observeUndoStack,
        index: observeStackIndex,
    }), ({ stack, index }) => index < stack.length);

    return {
        serviceName: 'UndoRedoService',
        undoStack: observeUndoStack,
        undoStackIndex: observeStackIndex,
        undoEnabled,
        redoEnabled,
        undo: () => {
            if (stackIndex > 0) {
                stackIndex--;
                database.transactions.applyOperations(undoStack[stackIndex].undo);
                setObserveStackIndex(stackIndex);
            }
        },
        redo: () => {
            if (stackIndex < undoStack.length) {
                database.transactions.applyOperations(undoStack[stackIndex].redo);
                stackIndex++;
                setObserveStackIndex(stackIndex);
            }
        },
    };
};
