import { createObservableState } from "../../observe/create-observable-state.js";
import { TransactionResult, TransactionWriteOperation } from "../database/transactional-store/transactional-store.js";
import { Database } from "../index.js";

export const createUndoRedoActions = (database: Database<any, any, any, { applyOperations: (operations: TransactionWriteOperation<any>[]) => void }>) => {
    const undoStack: TransactionResult<any>[] = [];
    let stackIndex = 0;
    const [observeUndoStack, setObserveUndoStack] = createObservableState<TransactionResult<unknown>[]>([]);
    const [observeStackIndex, setObserveStackIndex] = createObservableState<number>(0);
    database.observe.transactions(t => {
        if (t.undoable) {
            undoStack.length = stackIndex;
            undoStack.push(t);
            stackIndex++;
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
            }
        },
        redo: () => {
            if (stackIndex < undoStack.length) {
                database.transactions.applyOperations(undoStack[stackIndex].redo);
                stackIndex++;
            }
        },
    };
};
