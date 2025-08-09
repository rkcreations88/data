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

import { describe, it, expect, vi } from "vitest";
import { createDatabase } from "./create-database.js";
import { createStore } from "../store/create-store.js";
import { FromSchema, Schema } from "../../schema/schema.js";
import { Entity } from "../entity.js";
import { F32Schema } from "../../schema/f32.js";

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
} as const satisfies Schema;
type Position = FromSchema<typeof positionSchema>;

const healthSchema = {
    type: "object",
    properties: {
        current: F32Schema,
        max: F32Schema,
    },
    required: ["current", "max"],
    additionalProperties: false,
} as const satisfies Schema;
type Health = FromSchema<typeof healthSchema>;

const nameSchema = {
    type: "string",
    maxLength: 50,
} as const satisfies Schema;
type Name = FromSchema<typeof nameSchema>;

function createTestObservableStore() {
    const baseStore = createStore(
        { position: positionSchema, health: healthSchema, name: nameSchema },
        { time: { default: { delta: 0.016, elapsed: 0 } } },
        {
            Position: ["position"],
            Health: ["health"],
            PositionHealth: ["position", "health"],
            PositionName: ["position", "name"],
            Full: ["position", "health", "name"],
        }
    );

    return createDatabase(baseStore, {
        createPositionEntity(t, args: { position: { x: number, y: number, z: number } }) {
            return t.archetypes.Position.insert(args);
        },
        createPositionHealthEntity(t, args: { position: { x: number, y: number, z: number }, health: { current: number, max: number } }) {
            return t.archetypes.PositionHealth.insert(args);
        },
        createPositionNameEntity(t, args: { position: { x: number, y: number, z: number }, name: string }) {
            return t.archetypes.PositionName.insert(args);
        },
        createFullEntity(t, args: { position: { x: number, y: number, z: number }, health: { current: number, max: number }, name: string }) {
            return t.archetypes.Full.insert(args);
        },
        createEntityAndReturn(t, args: { position: Position, name: Name }) {
            return t.archetypes.PositionName.insert(args);
        },
        updateEntity(t, args: {
            entity: Entity,
            values: Partial<{
                position: { x: number, y: number, z: number },
                health: { current: number, max: number },
                name: string
            }>
        }) {
            t.update(args.entity, args.values);
        },
        deleteEntity(t, args: { entity: Entity }) {
            t.delete(args.entity);
        },
        updateTime(t, args: { delta: number, elapsed: number }) {
            t.resources.time = args;
        }
    });
}

describe("createDatabase", () => {
    it("should notify component observers when components change", () => {
        const store = createTestObservableStore();
        const positionObserver = vi.fn();
        const nameObserver = vi.fn();

        // Subscribe to component changes
        const unsubscribePosition = store.observe.components.position(positionObserver);
        const unsubscribeName = store.observe.components.name(nameObserver);

        // Create an entity that affects both components
        const testEntity = store.transactions.createFullEntity({
            position: { x: 1, y: 2, z: 3 },
            name: "Test",
            health: { current: 100, max: 100 }
        });

        // Both observers should be notified
        expect(positionObserver).toHaveBeenCalledTimes(1);
        expect(nameObserver).toHaveBeenCalledTimes(1);

        // Update only position
        store.transactions.updateEntity({
            entity: testEntity,
            values: { position: { x: 4, y: 5, z: 6 } }
        });

        // Only position observer should be notified
        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(nameObserver).toHaveBeenCalledTimes(1);

        // Unsubscribe and verify no more notifications
        unsubscribePosition();
        unsubscribeName();

        store.transactions.updateEntity({
            entity: testEntity,
            values: { position: { x: 7, y: 8, z: 9 }, name: "Updated" }
        });

        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(nameObserver).toHaveBeenCalledTimes(1);
    });

    it("should notify entity observers with correct values", () => {
        const store = createTestObservableStore();

        // Create initial entity
        const testEntity = store.transactions.createFullEntity({
            position: { x: 1, y: 2, z: 3 },
            name: "Test",
            health: { current: 100, max: 100 }
        });

        // Subscribe to entity changes
        const observer = vi.fn();
        const unsubscribe = store.observe.entity(testEntity)(observer);

        // Initial notification should have current values
        expect(observer).toHaveBeenCalledWith(expect.objectContaining({
            position: { x: 1, y: 2, z: 3 },
            name: "Test",
            health: { current: 100, max: 100 }
        }));

        // Update entity
        store.transactions.updateEntity({
            entity: testEntity,
            values: { name: "Updated", health: { current: 50, max: 100 } }
        });

        // Observer should be notified with new values
        expect(observer).toHaveBeenCalledWith(expect.objectContaining({
            position: { x: 1, y: 2, z: 3 }, // unchanged
            name: "Updated",
            health: { current: 50, max: 100 }
        }));

        // Delete entity
        store.transactions.deleteEntity({ entity: testEntity });

        // Observer should be notified with null
        expect(observer).toHaveBeenCalledWith(null);

        unsubscribe();
    });

    it("should notify transaction observers with full transaction results", () => {
        const store = createTestObservableStore();
        const transactionObserver = vi.fn();

        const unsubscribe = store.observe.transactions(transactionObserver);

        // Execute a transaction with multiple operations
        store.transactions.createFullEntity({
            position: { x: 1, y: 2, z: 3 },
            name: "Test",
            health: { current: 100, max: 100 }
        });

        // Transaction observer should be called with the full result
        expect(transactionObserver).toHaveBeenCalledWith(expect.objectContaining({
            changedEntities: expect.any(Map),
            changedComponents: expect.any(Set),
            changedArchetypes: expect.any(Set),
            redo: expect.any(Array),
            undo: expect.any(Array)
        }));

        const result = transactionObserver.mock.calls[0][0];
        expect(result.changedEntities.size).toBe(1);
        expect(result.changedComponents.has("position")).toBe(true);
        expect(result.changedComponents.has("name")).toBe(true);

        unsubscribe();
    });

    it("should notify archetype observers when entities change archetypes", () => {
        const store = createTestObservableStore();

        // Create initial entity
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        const archetype = store.locate(entity)?.archetype;
        expect(archetype).toBeDefined();

        const archetypeObserver = vi.fn();
        const unsubscribe = store.observe.archetype(archetype!.id)(archetypeObserver);

        // No initial notification for archetype observers
        expect(archetypeObserver).toHaveBeenCalledTimes(0);

        // Update entity to add name component, potentially changing archetype
        store.transactions.updateEntity({
            entity,
            values: { name: "Test" }
        });

        // Archetype observer should be notified of the change
        expect(archetypeObserver).toHaveBeenCalledTimes(1);

        unsubscribe();
    });

    it("should notify resource observers with immediate and update notifications", () => {
        const store = createTestObservableStore();

        const timeObserver = vi.fn();

        // Subscribe to resource changes
        const unsubscribeTime = store.observe.resources.time(timeObserver);

        // Observer should be notified immediately with initial value
        expect(timeObserver).toHaveBeenCalledWith({ delta: 0.016, elapsed: 0 });

        // Update time resource
        store.transactions.updateTime({ delta: 0.032, elapsed: 1 });

        // Observer should be notified with new value
        expect(timeObserver).toHaveBeenCalledWith({ delta: 0.032, elapsed: 1 });
    });

    it("should support multiple observers for the same target", () => {
        const store = createTestObservableStore();

        const observer1 = vi.fn();
        const observer2 = vi.fn();
        const observer3 = vi.fn();

        // Subscribe multiple observers to the same component
        const unsubscribe1 = store.observe.components.position(observer1);
        const unsubscribe2 = store.observe.components.position(observer2);
        const unsubscribe3 = store.observe.components.position(observer3);

        // Create entity with position
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        // All observers should be notified
        expect(observer1).toHaveBeenCalledTimes(1);
        expect(observer2).toHaveBeenCalledTimes(1);
        expect(observer3).toHaveBeenCalledTimes(1);

        // Unsubscribe one observer
        unsubscribe2();

        // Update position
        store.transactions.updateEntity({
            entity,
            values: { position: { x: 4, y: 5, z: 6 } }
        });

        // Only remaining observers should be notified
        expect(observer1).toHaveBeenCalledTimes(2);
        expect(observer2).toHaveBeenCalledTimes(1); // No more calls
        expect(observer3).toHaveBeenCalledTimes(2);

        unsubscribe1();
        unsubscribe3();
    });

    it("should handle observer cleanup correctly", () => {
        const store = createTestObservableStore();

        const observer = vi.fn();
        const unsubscribe = store.observe.components.position(observer);

        // Create entity
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        expect(observer).toHaveBeenCalledTimes(1);

        // Unsubscribe
        unsubscribe();

        // Update entity
        store.transactions.updateEntity({
            entity,
            values: { position: { x: 4, y: 5, z: 6 } }
        });

        // Observer should not be called after unsubscribe
        expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should handle observing non-existent entities", () => {
        const store = createTestObservableStore();

        const observer = vi.fn();
        const unsubscribe = store.observe.entity(999 as Entity)(observer);

        // Should be notified with null for non-existent entity
        expect(observer).toHaveBeenCalledWith(null);

        unsubscribe();
    });

    it("should handle complex transaction scenarios with multiple observers", () => {
        const store = createTestObservableStore();

        const positionObserver = vi.fn();
        const healthObserver = vi.fn();
        const transactionObserver = vi.fn();
        const entityObserver = vi.fn();

        // Subscribe to various observers
        const unsubscribePosition = store.observe.components.position(positionObserver);
        const unsubscribeHealth = store.observe.components.health(healthObserver);
        const unsubscribeTransaction = store.observe.transactions(transactionObserver);

        // Create entity
        const entity = store.transactions.createPositionHealthEntity({
            position: { x: 1, y: 2, z: 3 },
            health: { current: 100, max: 100 }
        });

        const unsubscribeEntity = store.observe.entity(entity)(entityObserver);

        // All observers should be notified
        expect(positionObserver).toHaveBeenCalledTimes(1);
        expect(healthObserver).toHaveBeenCalledTimes(1);
        expect(transactionObserver).toHaveBeenCalledTimes(1);
        expect(entityObserver).toHaveBeenCalledTimes(1);

        // Update multiple components
        store.transactions.updateEntity({
            entity,
            values: {
                position: { x: 4, y: 5, z: 6 },
                health: { current: 50, max: 100 }
            }
        });

        // All observers should be notified again
        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(healthObserver).toHaveBeenCalledTimes(2);
        expect(transactionObserver).toHaveBeenCalledTimes(2);
        expect(entityObserver).toHaveBeenCalledTimes(2);

        // Verify entity observer received correct values
        expect(entityObserver).toHaveBeenCalledWith(expect.objectContaining({
            position: { x: 4, y: 5, z: 6 },
            health: { current: 50, max: 100 }
        }));

        unsubscribePosition();
        unsubscribeHealth();
        unsubscribeTransaction();
        unsubscribeEntity();
    });

    it("should handle rapid successive changes efficiently", () => {
        const store = createTestObservableStore();

        const observer = vi.fn();
        const unsubscribe = store.observe.components.position(observer);

        // Create entity
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        // Make rapid successive updates
        for (let i = 0; i < 5; i++) {
            store.transactions.updateEntity({
                entity,
                values: { position: { x: i, y: i, z: i } }
            });
        }

        // Observer should be called for each change
        expect(observer).toHaveBeenCalledTimes(6); // 1 for create + 5 for updates

        unsubscribe();
    });

    it("should support transaction functions that return an Entity", () => {
        const store = createTestObservableStore();

        // Execute a transaction that returns an Entity
        const returnedEntity = store.transactions.createEntityAndReturn({
            position: { x: 10, y: 20, z: 30 },
            name: "ReturnedEntity"
        });

        // Verify that an Entity was returned
        expect(returnedEntity).toBeDefined();
        expect(typeof returnedEntity).toBe("number");

        // Verify the entity exists in the store
        const entityValues = store.read(returnedEntity);
        expect(entityValues).toBeDefined();
        expect(entityValues?.position).toEqual({ x: 10, y: 20, z: 30 });
        expect(entityValues?.name).toBe("ReturnedEntity");

        // Verify the entity can be found in the store using select
        const selectedEntities = store.select(["position", "name"]);
        expect(selectedEntities).toContain(returnedEntity);
    });

    describe("AsyncArgs Support", () => {
        it("should handle Promise-based async arguments", async () => {
            const store = createTestObservableStore();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create a promise that resolves to entity data
            const entityDataPromise = Promise.resolve({
                position: { x: 100, y: 200, z: 300 },
                name: "AsyncEntity"
            });

            // Execute transaction with promise argument wrapped in function
            store.transactions.createPositionNameEntity(() => entityDataPromise);

            // Wait for the promise to resolve
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify the entity was created with the resolved data
            const entities = store.select(["position", "name"]);
            const createdEntity = entities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "AsyncEntity";
            });

            expect(createdEntity).toBeDefined();
            const entityValues = store.read(createdEntity!);
            expect(entityValues?.position).toEqual({ x: 100, y: 200, z: 300 });
            expect(entityValues?.name).toBe("AsyncEntity");

            // Verify observer was notified
            expect(observer).toHaveBeenCalledTimes(1);

            unsubscribe();
        });

        it("should handle AsyncGenerator streaming arguments", async () => {
            const store = createTestObservableStore();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create an async generator that yields multiple entity data
            async function* entityDataStream() {
                yield { position: { x: 1, y: 1, z: 1 }, name: "Stream1" };
                yield { position: { x: 2, y: 2, z: 2 }, name: "Stream2" };
                yield { position: { x: 3, y: 3, z: 3 }, name: "Stream3" };
            }

            // Execute transaction with async generator wrapped in function
            store.transactions.createPositionNameEntity(() => entityDataStream());

            // Wait for all entities to be processed
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify only the final entity was created (each yield replaces the previous)
            const entities = store.select(["position", "name"]);
            const streamEntities = entities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name?.startsWith("Stream");
            });

            expect(streamEntities).toHaveLength(1); // Only the final entity remains

            // Verify the final entity has the correct data (from the last yield)
            const finalEntity = store.read(streamEntities[0]);
            expect(finalEntity?.position).toEqual({ x: 3, y: 3, z: 3 });
            expect(finalEntity?.name).toBe("Stream3");

            // Verify observer was notified for each entity creation (even though they were replaced)
            expect(observer.mock.calls.length >= 3);

            unsubscribe();
        });

        it("should handle AsyncGenerator with delays", async () => {
            const store = createTestObservableStore();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create an async generator with delays
            async function* delayedEntityStream() {
                yield { position: { x: 10, y: 10, z: 10 }, name: "Delayed1" };
                await new Promise(resolve => setTimeout(resolve, 5));
                yield { position: { x: 20, y: 20, z: 20 }, name: "Delayed2" };
                await new Promise(resolve => setTimeout(resolve, 5));
                yield { position: { x: 30, y: 30, z: 30 }, name: "Delayed3" };
            }

            // Execute transaction with delayed async generator wrapped in function
            store.transactions.createPositionNameEntity(() => delayedEntityStream());

            // Wait for all entities to be processed
            await new Promise(resolve => setTimeout(resolve, 20));

            // Verify all entities were created
            const entities = store.select(["position", "name"]);
            const delayedEntities = entities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name?.startsWith("Delayed");
            });

            expect(delayedEntities.length >= 3);
            expect(observer.mock.calls.length >= 3);

            unsubscribe();
        });

        it("should handle mixed sync and async arguments in the same transaction", async () => {
            const store = createTestObservableStore();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create entities with different argument types
            store.transactions.createPositionNameEntity({
                position: { x: 1, y: 1, z: 1 },
                name: "SyncEntity"
            });

            store.transactions.createPositionNameEntity(
                () => Promise.resolve({
                    position: { x: 2, y: 2, z: 2 },
                    name: "PromiseEntity"
                })
            );

            async function* streamEntityGenerator() {
                yield { position: { x: 3, y: 3, z: 3 }, name: "StreamEntity" };
            }

            store.transactions.createPositionNameEntity(() => streamEntityGenerator());

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify all entities were created
            const entities = store.select(["position", "name"]);
            const testEntities = entities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name?.endsWith("Entity");
            });

            expect(testEntities.length >= 3);

            const syncEntity = store.read(testEntities.find(e => store.read(e)?.name === "SyncEntity")!);
            const promiseEntity = store.read(testEntities.find(e => store.read(e)?.name === "PromiseEntity")!);
            const streamEntity = store.read(testEntities.find(e => store.read(e)?.name === "StreamEntity")!);

            expect(syncEntity?.position).toEqual({ x: 1, y: 1, z: 1 });
            expect(promiseEntity?.position).toEqual({ x: 2, y: 2, z: 2 });
            expect(streamEntity?.position).toEqual({ x: 3, y: 3, z: 3 });

            expect(observer.mock.calls.length >= 3);

            unsubscribe();
        });

        it("should handle AsyncGenerator that yields no values", async () => {
            const store = createTestObservableStore();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create an empty async generator
            async function* emptyStream() {
                // Yields nothing
            }

            // Execute transaction with empty async generator wrapped in function
            store.transactions.createPositionNameEntity(() => emptyStream());

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify no entities were created
            const entities = store.select(["position", "name"]);
            expect(entities).toHaveLength(0);
            expect(observer).toHaveBeenCalledTimes(0);

            unsubscribe();
        });

        it("should handle AsyncGenerator with error handling", async () => {
            const store = createTestObservableStore();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create an async generator that throws an error
            async function* errorStream() {
                yield { position: { x: 1, y: 1, z: 1 }, name: "BeforeError" };
                throw new Error("Test error");
            }

            // Execute transaction with error-throwing async generator wrapped in function
            store.transactions.createPositionNameEntity(() => errorStream());

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify only the first entity was created before the error
            const entities = store.select(["position", "name"]);
            const beforeErrorEntity = entities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "BeforeError";
            });

            expect(beforeErrorEntity).toBeDefined();
            expect(observer).toHaveBeenCalledTimes(1);

            unsubscribe();
        });

        it("should handle complex AsyncGenerator with conditional yielding", async () => {
            const store = createTestObservableStore();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create a complex async generator with conditional logic
            async function* conditionalStream() {
                for (let i = 0; i < 5; i++) {
                    if (i % 2 === 0) {
                        yield {
                            position: { x: i, y: i * 2, z: i * 3 },
                            name: `Even${i}`
                        };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }

            // Execute transaction with conditional async generator wrapped in function
            store.transactions.createPositionNameEntity(() => conditionalStream());

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 20));

            // Verify only the final entity was created (each yield replaces the previous)
            const entities = store.select(["position", "name"]);
            const evenEntities = entities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name?.startsWith("Even");
            });

            expect(evenEntities).toHaveLength(1); // Only the final entity remains (Even4)

            // Verify the final entity has the correct data (from the last yield)
            const finalEntity = store.read(evenEntities[0]);
            expect(finalEntity?.position).toEqual({ x: 4, y: 8, z: 12 });
            expect(finalEntity?.name).toBe("Even4");

            // Verify observer was notified for each entity creation (even though they were replaced)
            expect(observer).toHaveBeenCalledTimes(3);

            unsubscribe();
        });

        it("should maintain transaction integrity with async operations", async () => {
            const store = createTestObservableStore();
            const transactionObserver = vi.fn();
            const unsubscribe = store.observe.transactions(transactionObserver);

            // Create a promise that resolves to entity data
            const entityDataPromise = Promise.resolve({
                position: { x: 100, y: 200, z: 300 },
                name: "TransactionTest"
            });

            // Execute transaction with promise wrapped in function
            store.transactions.createPositionNameEntity(() => entityDataPromise);

            // Wait for the promise to resolve
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify transaction observer was called with proper transaction result
            expect(transactionObserver).toHaveBeenCalledWith(expect.objectContaining({
                changedEntities: expect.any(Map),
                changedComponents: expect.any(Set),
                changedArchetypes: expect.any(Set),
                redo: expect.any(Array),
                undo: expect.any(Array)
            }));

            const result = transactionObserver.mock.calls[0][0];
            expect(result.changedEntities.size).toBe(1);
            expect(result.changedComponents.has("position")).toBe(true);
            expect(result.changedComponents.has("name")).toBe(true);

            unsubscribe();
        });

        it("should handle undoable property correctly in async generator transactions", async () => {
            const store = createTestObservableStore();
            const transactionObserver = vi.fn();
            const unsubscribe = store.observe.transactions(transactionObserver);

            // Create an async generator that sets undoable property in intermediate transactions
            async function* undoableStream() {
                yield { position: { x: 1, y: 1, z: 1 }, name: "Step1" };
                yield { position: { x: 2, y: 2, z: 2 }, name: "Step2" };
                yield { position: { x: 3, y: 3, z: 3 }, name: "Step3" };
            }

            // Create a custom database with undoable transaction
            const baseStore = createStore(
                { position: positionSchema, name: nameSchema },
                { time: { default: { delta: 0.016, elapsed: 0 } } },
                {
                    PositionName: ["position", "name"],
                }
            );

            const customStore = createDatabase(baseStore, {
                createWithUndoable(t, args: { position: { x: number, y: number, z: number }, name: string }) {
                    // Set undoable property for this transaction
                    t.undoable = { coalesce: { operation: "create", name: args.name } };
                    return t.archetypes.PositionName.insert(args);
                }
            });

            // Set up observer on the custom store
            const customTransactionObserver = vi.fn();
            const customUnsubscribe = customStore.observe.transactions(customTransactionObserver);

            // Execute transaction with async generator wrapped in function
            customStore.transactions.createWithUndoable(() => undoableStream());

            // Wait for all entities to be processed
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify transaction observer was called multiple times (for each transient + final)
            expect(customTransactionObserver).toHaveBeenCalledTimes(4); // 3 transient + 1 final

            // Check the transient transactions - they should have the undoable property
            const transientTransactionCall1 = customTransactionObserver.mock.calls[0]; // First transient
            const transientTransactionCall2 = customTransactionObserver.mock.calls[1]; // Second transient
            const transientTransactionCall3 = customTransactionObserver.mock.calls[2]; // Third transient

            expect(transientTransactionCall1[0].transient).toBe(true);
            expect(transientTransactionCall1[0].undoable).toEqual({ coalesce: { operation: "create", name: "Step1" } });

            expect(transientTransactionCall2[0].transient).toBe(true);
            expect(transientTransactionCall2[0].undoable).toEqual({ coalesce: { operation: "create", name: "Step2" } });

            expect(transientTransactionCall3[0].transient).toBe(true);
            expect(transientTransactionCall3[0].undoable).toEqual({ coalesce: { operation: "create", name: "Step3" } });

            // Check that the final non-transient transaction has the undoable property from the last transient transaction
            const finalTransactionCall = customTransactionObserver.mock.calls[3]; // Last call should be final transaction
            const finalTransactionResult = finalTransactionCall[0];

            expect(finalTransactionResult.transient).toBe(false);
            // The undoable property should be preserved from the last transient transaction
            expect(finalTransactionResult.undoable).toEqual({ coalesce: { operation: "create", name: "Step3" } });

            // POTENTIAL ISSUE: Transient transactions with undoable properties might cause problems
            // in undo-redo systems that expect only non-transient transactions to be undoable.
            // This test documents the current behavior for future consideration.

            unsubscribe();
            customUnsubscribe();
        });

        it("should demonstrate potential issue with undo-redo system and transient transactions", async () => {
            // This test demonstrates a potential issue where transient transactions with undoable properties
            // might be incorrectly handled by undo-redo systems that expect only non-transient transactions
            // to be undoable.

            const baseStore = createStore(
                { position: positionSchema, name: nameSchema },
                { time: { default: { delta: 0.016, elapsed: 0 } } },
                {
                    PositionName: ["position", "name"],
                }
            );

            const customStore = createDatabase(baseStore, {
                createWithUndoable(t, args: { position: { x: number, y: number, z: number }, name: string }) {
                    // Set undoable property for this transaction
                    t.undoable = { coalesce: { operation: "create", name: args.name } };
                    return t.archetypes.PositionName.insert(args);
                }
            });

            const transactionObserver = vi.fn();
            const unsubscribe = customStore.observe.transactions(transactionObserver);

            // Create an async generator that yields multiple values
            async function* undoableStream() {
                yield { position: { x: 1, y: 1, z: 1 }, name: "Step1" };
                yield { position: { x: 2, y: 2, z: 2 }, name: "Step2" };
                yield { position: { x: 3, y: 3, z: 3 }, name: "Step3" };
            }

            // Execute transaction with async generator
            customStore.transactions.createWithUndoable(() => undoableStream());

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Collect all transaction results
            const allTransactions = transactionObserver.mock.calls.map(call => call[0]);

            // Verify we have the expected number of transactions
            expect(allTransactions).toHaveLength(4); // 3 transient + 1 final

            // Check that transient transactions have undoable properties
            const transientTransactions = allTransactions.filter(t => t.transient);
            expect(transientTransactions).toHaveLength(3);

            // POTENTIAL ISSUE: Transient transactions with undoable properties
            // This could cause problems in undo-redo systems that:
            // 1. Expect only non-transient transactions to be undoable
            // 2. Might try to undo transient transactions incorrectly
            // 3. Could have issues with coalescing logic that doesn't account for transient transactions

            // The current implementation preserves the undoable property from the last transient transaction
            // in the final non-transient transaction, which might be the intended behavior.
            // However, this could lead to unexpected behavior in undo-redo systems.

            const finalTransaction = allTransactions.find(t => !t.transient);
            expect(finalTransaction).toBeDefined();
            expect(finalTransaction!.undoable).toEqual({ coalesce: { operation: "create", name: "Step3" } });

            unsubscribe();
        });
    });

    describe("entity observation with minArchetype filtering", () => {
        it("should observe entity when it matches minArchetype exactly", () => {
            const store = createTestObservableStore();

            // Create entity with position only
            const entity = store.transactions.createPositionEntity({
                position: { x: 1, y: 2, z: 3 }
            });

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(entity, store.archetypes.Position)(observer);

            // Should receive the entity data since it matches exactly
            expect(observer).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 }
            }));

            unsubscribe();
        });

        it("should observe entity when it has more components than minArchetype", () => {
            const store = createTestObservableStore();

            // Create entity with position and health
            const entity = store.transactions.createPositionHealthEntity({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(entity, store.archetypes.Position)(observer);

            // Should receive the entity data since it has all required components
            expect(observer).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 }
            }));

            unsubscribe();
        });

        it("should return null when entity has fewer components than minArchetype", () => {
            const store = createTestObservableStore();

            // Create entity with position only
            const entity = store.transactions.createPositionEntity({
                position: { x: 1, y: 2, z: 3 }
            });

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(entity, store.archetypes.PositionHealth)(observer);

            // Should return null since entity doesn't have health component
            expect(observer).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it("should return null when entity has different components than minArchetype", () => {
            const store = createTestObservableStore();

            // Create entity with position and name
            const entity = store.transactions.createPositionNameEntity({
                position: { x: 1, y: 2, z: 3 },
                name: "Test"
            });

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(entity, store.archetypes.PositionHealth)(observer);

            // Should return null since entity doesn't have health component
            expect(observer).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it("should update observation when entity gains required components", () => {
            const store = createTestObservableStore();

            // Create entity with position only
            const entity = store.transactions.createPositionEntity({
                position: { x: 1, y: 2, z: 3 }
            });

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(entity, store.archetypes.PositionHealth)(observer);

            // Initially should be null
            expect(observer).toHaveBeenCalledWith(null);

            // Add health component
            store.transactions.updateEntity({
                entity,
                values: { health: { current: 100, max: 100 } }
            });

            // Should now receive the entity data
            expect(observer).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            }));

            unsubscribe();
        });

        it("should update observation when entity loses required components", () => {
            const store = createTestObservableStore();

            // Create entity with position and health
            const entity = store.transactions.createPositionHealthEntity({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(entity, store.archetypes.PositionHealth)(observer);

            // Initially should receive data
            expect(observer).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            }));

            // Remove health component
            store.transactions.updateEntity({
                entity,
                values: { health: undefined }
            });

            // Should now return null
            expect(observer).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it("should handle entity deletion correctly with minArchetype", () => {
            const store = createTestObservableStore();

            // Create entity with position and health
            const entity = store.transactions.createPositionHealthEntity({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(entity, store.archetypes.PositionHealth)(observer);

            // Initially should receive data
            expect(observer).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 }
            }));

            // Delete entity
            store.transactions.deleteEntity({ entity });

            // Should return null for deleted entity
            expect(observer).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it("should handle non-existent entity with minArchetype", () => {
            const store = createTestObservableStore();

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(999 as Entity, store.archetypes.Position)(observer);

            // Should return null for non-existent entity
            expect(observer).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it("should handle invalid entity ID with minArchetype", () => {
            const store = createTestObservableStore();

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(-1, store.archetypes.Position)(observer);

            // Should return null for invalid entity ID
            expect(observer).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it("should maintain separate observations for different minArchetypes", () => {
            const store = createTestObservableStore();

            // Create entity with position and health
            const entity = store.transactions.createPositionHealthEntity({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            const positionObserver = vi.fn();
            const healthObserver = vi.fn();
            const fullObserver = vi.fn();

            const unsubscribePosition = store.observe.entity(entity, store.archetypes.Position)(positionObserver);
            const unsubscribeHealth = store.observe.entity(entity, store.archetypes.Health)(healthObserver);
            const unsubscribeFull = store.observe.entity(entity, store.archetypes.PositionHealth)(fullObserver);

            // All should receive data since entity has all components
            expect(positionObserver).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 }
            }));
            expect(healthObserver).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                health: { current: 100, max: 100 }
            }));
            expect(fullObserver).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            }));

            // Remove health component
            store.transactions.updateEntity({
                entity,
                values: { health: undefined }
            });

            // Position observer should still receive data
            expect(positionObserver).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 }
            }));
            // Health and full observers should return null
            expect(healthObserver).toHaveBeenCalledWith(null);
            expect(fullObserver).toHaveBeenCalledWith(null);

            unsubscribePosition();
            unsubscribeHealth();
            unsubscribeFull();
        });

        it("should handle component updates that don't affect minArchetype requirements", () => {
            const store = createTestObservableStore();

            // Create entity with position and health
            const entity = store.transactions.createPositionHealthEntity({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(entity, store.archetypes.PositionHealth)(observer);

            // Initially should receive data
            expect(observer).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 1, y: 2, z: 3 }
            }));

            // Update position (should trigger notification)
            store.transactions.updateEntity({
                entity,
                values: { position: { x: 10, y: 20, z: 30 } }
            });

            // Should receive updated data
            expect(observer).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 10, y: 20, z: 30 }
            }));

            // Update health (should not affect position observation)
            store.transactions.updateEntity({
                entity,
                values: { health: { current: 50, max: 100 } }
            });

            // Should still receive position data (health update shouldn't trigger position observer)
            expect(observer).toHaveBeenCalledWith(expect.objectContaining({
                id: entity,
                position: { x: 10, y: 20, z: 30 }
            }));

            unsubscribe();
        });
    });
});

describe("toData/fromData functionality", () => {
    it("should serialize and deserialize database state correctly", () => {
        const store = createTestObservableStore();

        // Create some entities and update resources
        const entity1 = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });
        const entity2 = store.transactions.createFullEntity({
            position: { x: 4, y: 5, z: 6 },
            health: { current: 100, max: 100 },
            name: "TestEntity"
        });
        store.transactions.updateTime({ delta: 0.033, elapsed: 1.5 });

        // Serialize the database
        const serializedData = store.toData();

        // Create a new database and restore from serialized data
        const newStore = createTestObservableStore();
        newStore.fromData(serializedData);

        // Verify entities are restored
        const restoredEntities = newStore.select(["position"]);
        expect(restoredEntities).toHaveLength(2);

        // Verify entity data is correct
        const restoredData1 = newStore.read(restoredEntities[0]);
        const restoredData2 = newStore.read(restoredEntities[1]);
        expect(restoredData1).toEqual({
            id: restoredEntities[0],
            position: { x: 1, y: 2, z: 3 }
        });
        expect(restoredData2).toEqual({
            id: restoredEntities[1],
            position: { x: 4, y: 5, z: 6 },
            health: { current: 100, max: 100 },
            name: "TestEntity"
        });

        // Verify resources are restored
        expect(newStore.resources.time).toEqual({ delta: 0.033, elapsed: 1.5 });
    });

    it("should notify all observers when database is restored from serialized data", () => {
        const store = createTestObservableStore();

        // Create initial state
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });
        store.transactions.updateTime({ delta: 0.016, elapsed: 0 });

        // Set up observers
        const positionObserver = vi.fn();
        const timeObserver = vi.fn();
        const entityObserver = vi.fn();
        const transactionObserver = vi.fn();

        const unsubscribePosition = store.observe.components.position(positionObserver);
        const unsubscribeTime = store.observe.resources.time(timeObserver);
        const unsubscribeEntity = store.observe.entity(entity)(entityObserver);
        const unsubscribeTransaction = store.observe.transactions(transactionObserver);

        // Clear initial notifications
        positionObserver.mockClear();
        timeObserver.mockClear();
        entityObserver.mockClear();
        transactionObserver.mockClear();

        // Serialize the database
        const serializedData = store.toData();

        // Create a new database with different state
        const newStore = createTestObservableStore();
        const newEntity = newStore.transactions.createFullEntity({
            position: { x: 10, y: 20, z: 30 },
            health: { current: 50, max: 100 },
            name: "NewEntity"
        });
        newStore.transactions.updateTime({ delta: 0.025, elapsed: 2.0 });

        // Set up observers on the new store
        const newPositionObserver = vi.fn();
        const newTimeObserver = vi.fn();
        const newEntityObserver = vi.fn();
        const newTransactionObserver = vi.fn();

        const newUnsubscribePosition = newStore.observe.components.position(newPositionObserver);
        const newUnsubscribeTime = newStore.observe.resources.time(newTimeObserver);
        const newUnsubscribeEntity = newStore.observe.entity(newEntity)(newEntityObserver);
        const newUnsubscribeTransaction = newStore.observe.transactions(newTransactionObserver);

        // Clear initial notifications
        newPositionObserver.mockClear();
        newTimeObserver.mockClear();
        newEntityObserver.mockClear();
        newTransactionObserver.mockClear();

        // Restore from serialized data
        newStore.fromData(serializedData);

        // All observers should be notified because the entire state changed
        expect(newPositionObserver).toHaveBeenCalledTimes(1);
        expect(newTimeObserver).toHaveBeenCalledTimes(1);
        expect(newEntityObserver).toHaveBeenCalledTimes(1);
        expect(newTransactionObserver).toHaveBeenCalledTimes(1);

        // Verify the transaction observer received the correct notification
        const transactionResult = newTransactionObserver.mock.calls[0][0];
        expect(transactionResult.changedComponents.has("position")).toBe(true);
        expect(transactionResult.transient).toBe(false);

        // Verify the entity observer received the correct data
        const entityData = newEntityObserver.mock.calls[0][0];
        expect(entityData).toEqual({
            id: newEntity,
            position: { x: 1, y: 2, z: 3 }
        });

        // Verify the time observer received the correct data
        const timeData = newTimeObserver.mock.calls[0][0];
        expect(timeData).toEqual({ delta: 0.016, elapsed: 0 });

        // Clean up
        unsubscribePosition();
        unsubscribeTime();
        unsubscribeEntity();
        unsubscribeTransaction();
        newUnsubscribePosition();
        newUnsubscribeTime();
        newUnsubscribeEntity();
        newUnsubscribeTransaction();
    });

    it("should notify observers even when no entities exist in restored data", () => {
        const store = createTestObservableStore();

        // Set up observers on empty store
        const positionObserver = vi.fn();
        const timeObserver = vi.fn();
        const transactionObserver = vi.fn();

        const unsubscribePosition = store.observe.components.position(positionObserver);
        const unsubscribeTime = store.observe.resources.time(timeObserver);
        const unsubscribeTransaction = store.observe.transactions(transactionObserver);

        // Clear initial notifications
        positionObserver.mockClear();
        timeObserver.mockClear();
        transactionObserver.mockClear();

        // Serialize empty database
        const serializedData = store.toData();

        // Create a new database with some data
        const newStore = createTestObservableStore();
        newStore.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });
        newStore.transactions.updateTime({ delta: 0.033, elapsed: 1.5 });

        // Set up observers on the new store
        const newPositionObserver = vi.fn();
        const newTimeObserver = vi.fn();
        const newTransactionObserver = vi.fn();

        const newUnsubscribePosition = newStore.observe.components.position(newPositionObserver);
        const newUnsubscribeTime = newStore.observe.resources.time(newTimeObserver);
        const newUnsubscribeTransaction = newStore.observe.transactions(newTransactionObserver);

        // Clear initial notifications
        newPositionObserver.mockClear();
        newTimeObserver.mockClear();
        newTransactionObserver.mockClear();

        // Restore from empty serialized data
        newStore.fromData(serializedData);

        // All observers should still be notified
        expect(newPositionObserver).toHaveBeenCalledTimes(1);
        expect(newTimeObserver).toHaveBeenCalledTimes(1);
        expect(newTransactionObserver).toHaveBeenCalledTimes(1);

        // Verify the store is now empty
        const entities = newStore.select(["position"]);
        expect(entities).toHaveLength(0);
        expect(newStore.resources.time).toEqual({ delta: 0.016, elapsed: 0 });

        // Clean up
        unsubscribePosition();
        unsubscribeTime();
        unsubscribeTransaction();
        newUnsubscribePosition();
        newUnsubscribeTime();
        newUnsubscribeTransaction();
    });

    it("should handle entity observers correctly during restoration", () => {
        const store = createTestObservableStore();

        // Create entity and set up observer
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        const entityObserver = vi.fn();
        const unsubscribe = store.observe.entity(entity)(entityObserver);

        // Clear initial notification
        entityObserver.mockClear();

        // Serialize the database
        const serializedData = store.toData();

        // Create a new database
        const newStore = createTestObservableStore();

        // Set up observer on the new store for a different entity
        const newEntity = newStore.transactions.createFullEntity({
            position: { x: 10, y: 20, z: 30 },
            health: { current: 100, max: 100 },
            name: "NewEntity"
        });

        const newEntityObserver = vi.fn();
        const newUnsubscribe = newStore.observe.entity(newEntity)(newEntityObserver);

        // Clear initial notification
        newEntityObserver.mockClear();

        // Restore from serialized data
        newStore.fromData(serializedData);

        // The entity observer should be notified with the restored entity data
        expect(newEntityObserver).toHaveBeenCalledTimes(1);
        const restoredEntityData = newEntityObserver.mock.calls[0][0];
        expect(restoredEntityData).toEqual({
            id: newEntity,
            position: { x: 1, y: 2, z: 3 }
        });

        // Clean up
        unsubscribe();
        newUnsubscribe();
    });

    it("should preserve transaction functionality after restoration", () => {
        const store = createTestObservableStore();

        // Create initial state
        store.transactions.updateTime({ delta: 0.016, elapsed: 0 });

        // Serialize the database
        const serializedData = store.toData();

        // Create a new database and restore
        const newStore = createTestObservableStore();
        newStore.fromData(serializedData);

        // Verify transactions still work
        const entity = newStore.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        expect(entity).toBeDefined();
        expect(typeof entity).toBe("number");

        const entityData = newStore.read(entity);
        expect(entityData).toEqual({
            id: entity,
            position: { x: 1, y: 2, z: 3 }
        });

        // Verify resource transactions work
        newStore.transactions.updateTime({ delta: 0.033, elapsed: 1.5 });
        expect(newStore.resources.time).toEqual({ delta: 0.033, elapsed: 1.5 });
    });
}); 