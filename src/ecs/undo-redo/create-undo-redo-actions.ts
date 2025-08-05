import { createObservableState } from "../../observe/create-observable-state.js";
import { TransactionResult, TransactionWriteOperation } from "../database/transactional-store/transactional-store.js";
import { Database } from "../index.js";
import { shouldCoalesceTransactions, coalesceTransactions } from "../database/transactional-store/coalesce-transactions.js";

export const createUndoRedoActions = (database: Database<any, any, any, { applyOperations: (operations: TransactionWriteOperation<any>[]) => void }>) => {
    const undoStack: TransactionResult<any>[] = [];
    let stackIndex = 0;
    const [observeUndoStack, setObserveUndoStack] = createObservableState<TransactionResult<unknown>[]>([]);
    const [observeStackIndex, setObserveStackIndex] = createObservableState<number>(0);
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
    return {
        undoStack: observeUndoStack,
        undoStackIndex: observeStackIndex,
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
