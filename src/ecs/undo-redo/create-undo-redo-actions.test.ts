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
import { describe, it, expect, beforeEach } from "vitest";
import { createDatabase } from "../database/create-database.js";
import { createStore } from "../store/create-store.js";
import { F32Schema } from "../../schema/f32.js";
import { createUndoRedoActions } from "./create-undo-redo-actions.js";
import { applyOperations } from "../database/transactional-store/apply-operations.js";
import { toPromise } from "../../observe/to-promise.js";
import { TransactionWriteOperation } from "../database/transactional-store/transactional-store.js";

// Test schemas
const positionSchema = {
    type: "object",
    properties: {
        x: F32Schema,
        y: F32Schema,
        z: F32Schema,
    },
    required: ["x", "y", "z"],
    additionalProperties: false,
} as const;

const nameSchema = {
    type: "string",
    maxLength: 50,
} as const;

function createTestDatabase() {
    const baseStore = createStore(
        { position: positionSchema, name: nameSchema },
        { time: { default: { delta: 0.016, elapsed: 0 } } },
        {
            PositionEntity: ["position"],
            PositionNameEntity: ["position", "name"],
        }
    );

    return createDatabase(baseStore, {
        createPositionEntity(t, args: { position: { x: number, y: number, z: number } }) {
            t.undoable = { id: "createPosition", coalesce: false };
            return t.archetypes.PositionEntity.insert(args);
        },
        createPositionNameEntity(t, args: { position: { x: number, y: number, z: number }, name: string }) {
            t.undoable = { id: "createPositionName", coalesce: false };
            return t.archetypes.PositionNameEntity.insert(args);
        },
        updateEntity(t, args: {
            entity: number,
            values: Partial<{
                position: { x: number, y: number, z: number },
                name: string
            }>
        }) {
            t.undoable = { id: "updateEntity", coalesce: true };
            t.update(args.entity, args.values);
        },
        deleteEntity(t, args: { entity: number }) {
            t.undoable = { id: "deleteEntity", coalesce: false };
            t.delete(args.entity);
        },
        applyOperations(t, operations: TransactionWriteOperation<any>[]) {
            applyOperations(t, operations);
        }
    });
}

describe("createUndoRedoActions", () => {
    let database: ReturnType<typeof createTestDatabase>;
    let undoRedo: ReturnType<typeof createUndoRedoActions>;

    beforeEach(() => {
        database = createTestDatabase();
        undoRedo = createUndoRedoActions(database);
    });

    it("should add undoable transactions to the undo stack", async () => {
        const entity = database.transactions.createPositionEntity({ position: { x: 1, y: 2, z: 3 } });
        const undoStack = await toPromise(undoRedo.undoStack);
        expect(undoStack).toHaveLength(1);
        expect(undoStack[0].undoable?.id).toBe("createPosition");
    });

}); 