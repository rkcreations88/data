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

    return createDatabase(baseStore, store => ({
        createPositionEntity(args: { position: { x: number, y: number, z: number } }) {
            return store.archetypes.Position.insert(args);
        },
        createPositionHealthEntity(args: { position: { x: number, y: number, z: number }, health: { current: number, max: number } }) {
            return store.archetypes.PositionHealth.insert(args);
        },
        createPositionNameEntity(args: { position: { x: number, y: number, z: number }, name: string }) {
            return store.archetypes.PositionName.insert(args);
        },
        createFullEntity(args: { position: { x: number, y: number, z: number }, health: { current: number, max: number }, name: string }) {
            return store.archetypes.Full.insert(args);
        },
        createEntityAndReturn(args: { position: Position, name: Name }) {
            return store.archetypes.PositionName.insert(args);
        },
        updateEntity(args: {
            entity: Entity,
            values: Partial<{
                position: { x: number, y: number, z: number },
                health: { current: number, max: number },
                name: string
            }>
        }) {
            store.update(args.entity, args.values);
        },
        deleteEntity(args: { entity: Entity }) {
            store.delete(args.entity);
        },
        updateTime(args: { delta: number, elapsed: number }) {
            store.resources.time = args;
        }
    }));
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

            // Verify all entities were created
            const entities = store.select(["position", "name"]);
            const streamEntities = entities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name?.startsWith("Stream");
            });

            expect(streamEntities).toHaveLength(3);

            // Verify each entity has correct data
            const entity1 = store.read(streamEntities[0]);
            const entity2 = store.read(streamEntities[1]);
            const entity3 = store.read(streamEntities[2]);

            expect(entity1?.position).toEqual({ x: 1, y: 1, z: 1 });
            expect(entity1?.name).toBe("Stream1");
            expect(entity2?.position).toEqual({ x: 2, y: 2, z: 2 });
            expect(entity2?.name).toBe("Stream2");
            expect(entity3?.position).toEqual({ x: 3, y: 3, z: 3 });
            expect(entity3?.name).toBe("Stream3");

            // Verify observer was notified for each entity
            expect(observer).toHaveBeenCalledTimes(3);

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

            expect(delayedEntities).toHaveLength(3);
            expect(observer).toHaveBeenCalledTimes(3);

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

            expect(testEntities).toHaveLength(3);

            const syncEntity = store.read(testEntities.find(e => store.read(e)?.name === "SyncEntity")!);
            const promiseEntity = store.read(testEntities.find(e => store.read(e)?.name === "PromiseEntity")!);
            const streamEntity = store.read(testEntities.find(e => store.read(e)?.name === "StreamEntity")!);

            expect(syncEntity?.position).toEqual({ x: 1, y: 1, z: 1 });
            expect(promiseEntity?.position).toEqual({ x: 2, y: 2, z: 2 });
            expect(streamEntity?.position).toEqual({ x: 3, y: 3, z: 3 });

            expect(observer).toHaveBeenCalledTimes(3);

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

            // Verify only even-numbered entities were created
            const entities = store.select(["position", "name"]);
            const evenEntities = entities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name?.startsWith("Even");
            });

            expect(evenEntities).toHaveLength(3); // Even 0, 2, 4

            // Verify correct data for each entity
            const even0 = store.read(evenEntities.find(e => store.read(e)?.name === "Even0")!);
            const even2 = store.read(evenEntities.find(e => store.read(e)?.name === "Even2")!);
            const even4 = store.read(evenEntities.find(e => store.read(e)?.name === "Even4")!);

            expect(even0?.position).toEqual({ x: 0, y: 0, z: 0 });
            expect(even2?.position).toEqual({ x: 2, y: 4, z: 6 });
            expect(even4?.position).toEqual({ x: 4, y: 8, z: 12 });

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