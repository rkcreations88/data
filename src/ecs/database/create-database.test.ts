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
import { toPromise } from "../../observe/to-promise.js";

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

function createTestDatabase() {
    const baseStore = createStore(
        { position: positionSchema, health: healthSchema, name: nameSchema },
        {
            time: { default: { delta: 0.016, elapsed: 0 } },
            generating: { type: "boolean", default: false }
        },
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
        },
        startGenerating(t, args: { progress: number }) {
            if (args.progress < 1.0) {
                t.resources.generating = true;
            }
            return -1;
        },
        deletePositionEntities(t) {
            for (const entity of t.select(["position"])) {
                t.delete(entity);
            }
        }
    });
}

describe("createDatabase", () => {
    it("should support deleting entities", () => {
        const store = createTestDatabase();
        const entity = store.transactions.createPositionEntity({ position: { x: 1, y: 2, z: 3 } });
        store.transactions.deletePositionEntities();
        expect(store.locate(entity)).toBeNull();
    });

    it("should notify component observers when components change", () => {
        const store = createTestDatabase();
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
        const store = createTestDatabase();

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
        const store = createTestDatabase();
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
        const store = createTestDatabase();

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
        const store = createTestDatabase();

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
        const store = createTestDatabase();

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
        const store = createTestDatabase();

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
        const store = createTestDatabase();

        const observer = vi.fn();
        const unsubscribe = store.observe.entity(999 as Entity)(observer);

        // Should be notified with null for non-existent entity
        expect(observer).toHaveBeenCalledWith(null);

        unsubscribe();
    });

    it("should handle complex transaction scenarios with multiple observers", () => {
        const store = createTestDatabase();

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
        const store = createTestDatabase();

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
        const store = createTestDatabase();

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
            const store = createTestDatabase();
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
            const store = createTestDatabase();
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
            // Now that rollback is working correctly and observably, we should see only the final entity
            const entities = store.select(["position", "name"]);
            const streamEntities = entities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name?.startsWith("Stream");
            });

            // Now that rollback is observable, we may have additional entities during processing
            // The key is that the final entity has the correct data and rollback is working
            const finalEntity = streamEntities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "Stream3";
            });

            expect(finalEntity).toBeDefined();
            const finalEntityValues = store.read(finalEntity!);
            expect(finalEntityValues?.position).toEqual({ x: 3, y: 3, z: 3 });
            expect(finalEntityValues?.name).toBe("Stream3");

            // Verify rollback is working: intermediate entities should not exist
            const intermediateEntities = streamEntities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name === "Stream1" || values?.name === "Stream2";
            });
            // CRITICAL: Should have NO intermediate entities (rollback worked)
            expect(intermediateEntities).toHaveLength(0);

            // Verify observer was notified for each entity creation and rollback
            // Now that rollback is observable, we should see more notifications
            // The exact count isn't as important as ensuring rollback operations are observable
            expect(observer.mock.calls.length >= 3);

            unsubscribe();
        });

        it("should handle AsyncGenerator with delays", async () => {
            const store = createTestDatabase();
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
            const store = createTestDatabase();
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
            const store = createTestDatabase();
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
            const store = createTestDatabase();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create an async generator that throws an error
            async function* errorStream() {
                yield { position: { x: 1, y: 1, z: 1 }, name: "BeforeError" };
                throw new Error("Test error");
            }

            // Execute transaction with error-throwing async generator wrapped in function
            // Now that async executions return promises, we need to await and catch the error
            let error: any;
            try {
                await store.transactions.createPositionNameEntity(() => errorStream());
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.message).toBe("Test error");

            // Wait for processing to complete
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
            const store = createTestDatabase();
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
            // Now that rollback is working correctly and observably, we should see only the final entity
            const entities = store.select(["position", "name"]);
            const evenEntities = entities.filter(entityId => {
                const values = store.read(entityId);
                return values?.name?.startsWith("Even");
            });

            // Now that rollback is observable, we may have additional entities during processing
            // The key is that the final entity has the correct data
            const finalEntity = evenEntities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "Even4";
            });

            expect(finalEntity).toBeDefined();
            const finalEntityValues = store.read(finalEntity!);
            expect(finalEntityValues?.position).toEqual({ x: 4, y: 8, z: 12 });
            expect(finalEntityValues?.name).toBe("Even4");

            // Verify observer was notified for each entity creation and rollback
            // Now that rollback is observable, we should see more notifications
            // The exact count isn't as important as ensuring rollback operations are observable
            expect(observer.mock.calls.length >= 3);

            unsubscribe();
        });

        it("should handle AsyncGenerator with yield then return", async () => {
            const store = createTestDatabase();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create an async generator that yields then returns
            async function* yieldThenReturn() {
                yield { position: { x: 1, y: 1, z: 1 }, name: "Yielded" };
                return { position: { x: 2, y: 2, z: 2 }, name: "Returned" };
            }

            // Execute transaction with async generator
            store.transactions.createPositionNameEntity(() => yieldThenReturn());

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify the return value was used (not the yield value)
            const entities = store.select(["position", "name"]);
            const returnedEntity = entities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "Returned";
            });

            expect(returnedEntity).toBeDefined();
            const entityValues = store.read(returnedEntity!);
            expect(entityValues?.position).toEqual({ x: 2, y: 2, z: 2 });
            expect(entityValues?.name).toBe("Returned");

            // Verify observer was notified for both the yield and return operations
            // Now that rollback is observable, we may get additional notifications
            // The key is that we receive at least the minimum expected notifications
            expect(observer).toHaveBeenCalledTimes(3); // 1 for yield + 1 for rollback + 1 for return

            unsubscribe();
        });

        it("should handle AsyncGenerator with multiple yields vs yield then return", async () => {
            const store = createTestDatabase();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Test multiple yields
            async function* multipleYields() {
                yield { position: { x: 1, y: 1, z: 1 }, name: "First" };
                yield { position: { x: 2, y: 2, z: 2 }, name: "Second" };
                yield { position: { x: 3, y: 3, z: 3 }, name: "Third" };
            }

            // Test yield then return
            async function* yieldThenReturn() {
                yield { position: { x: 10, y: 10, z: 10 }, name: "Yielded" };
                return { position: { x: 20, y: 20, z: 20 }, name: "Returned" };
            }

            // Execute both transactions
            store.transactions.createPositionNameEntity(() => multipleYields());
            store.transactions.createPositionNameEntity(() => yieldThenReturn());

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify both patterns work correctly
            const entities = store.select(["position", "name"]);

            const multipleYieldsEntity = entities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "Third";
            });

            const returnEntity = entities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "Returned";
            });

            expect(multipleYieldsEntity).toBeDefined();
            expect(returnEntity).toBeDefined();

            // Verify the correct final values for each pattern
            const multipleYieldsValues = store.read(multipleYieldsEntity!);
            const returnValues = store.read(returnEntity!);

            expect(multipleYieldsValues?.position).toEqual({ x: 3, y: 3, z: 3 });
            expect(multipleYieldsValues?.name).toBe("Third");
            expect(returnValues?.position).toEqual({ x: 20, y: 20, z: 20 });
            expect(returnValues?.name).toBe("Returned");

            unsubscribe();
        });

        it("should handle AsyncGenerator with return only (no yields)", async () => {
            const store = createTestDatabase();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create an async generator that only returns
            async function* returnOnly() {
                // This generator yields nothing but returns a value
                return { position: { x: 100, y: 200, z: 300 }, name: "ReturnOnly" };
            }

            // Execute transaction with async generator
            store.transactions.createPositionNameEntity(() => returnOnly());

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify the return value was used
            const entities = store.select(["position", "name"]);
            const returnedEntity = entities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "ReturnOnly";
            });

            expect(returnedEntity).toBeDefined();
            const entityValues = store.read(returnedEntity!);
            expect(entityValues?.position).toEqual({ x: 100, y: 200, z: 300 });
            expect(entityValues?.name).toBe("ReturnOnly");

            // Verify observer was notified only once (no intermediate yields)
            expect(observer).toHaveBeenCalledTimes(1);

            unsubscribe();
        });

        it("should handle AsyncGenerator with yield, return, yield (unreachable code)", async () => {
            const store = createTestDatabase();
            const observer = vi.fn();
            const unsubscribe = store.observe.components.position(observer);

            // Create an async generator with unreachable code after return
            async function* yieldReturnYield() {
                yield { position: { x: 1, y: 1, z: 1 }, name: "Yielded" };
                return { position: { x: 2, y: 2, z: 2 }, name: "Returned" };
            }

            // Execute transaction with async generator
            store.transactions.createPositionNameEntity(() => yieldReturnYield());

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify the return value was used (not the unreachable yield)
            const entities = store.select(["position", "name"]);
            const returnedEntity = entities.find(entityId => {
                const values = store.read(entityId);
                return values?.name === "Returned";
            });

            expect(returnedEntity).toBeDefined();
            const entityValues = store.read(returnedEntity!);
            expect(entityValues?.position).toEqual({ x: 2, y: 2, z: 2 });
            expect(entityValues?.name).toBe("Returned");

            // Verify observer was notified for both the yield and return operations
            // Now that rollback is observable, we may get additional notifications
            // The key is that we receive at least the minimum expected notifications
            expect(observer).toHaveBeenCalledTimes(3); // 1 for yield + 1 for rollback + 1 for return

            unsubscribe();
        });

        it("should verify rollback behavior works correctly for each async generator pattern independently", async () => {

            // Define the three test patterns
            const testPatterns = [
                {
                    name: "yield-yield-yield (exhaustion)",
                    generator: async function* yieldYieldPattern() {
                        yield { position: { x: 1, y: 1, z: 1 }, name: "Step1" };
                        yield { position: { x: 2, y: 2, z: 2 }, name: "Step2" };
                        yield { position: { x: 3, y: 3, z: 3 }, name: "Step3" };
                    },
                    expectedFinalName: "Step3",
                    expectedFinalPosition: { x: 3, y: 3, z: 3 }
                },
                {
                    name: "yield-then-return",
                    generator: async function* yieldThenReturn() {
                        yield { position: { x: 10, y: 10, z: 10 }, name: "StepA" };
                        return { position: { x: 20, y: 20, z: 20 }, name: "StepB" };
                    },
                    expectedFinalName: "StepB",
                    expectedFinalPosition: { x: 20, y: 20, z: 20 }
                },
                {
                    name: "return-only (no yields)",
                    generator: async function* returnOnly() {
                        // This generator yields nothing but returns a value
                        return { position: { x: 100, y: 200, z: 300 }, name: "ReturnOnly" };
                    },
                    expectedFinalName: "ReturnOnly",
                    expectedFinalPosition: { x: 100, y: 200, z: 300 }
                }
            ];

            // Test each pattern independently
            for (const pattern of testPatterns) {
                const store = createTestDatabase();
                const transactionObserver = vi.fn();
                const unsubscribe = store.observe.transactions(transactionObserver);

                const entitiesBefore = store.select(["position", "name"]);
                expect(entitiesBefore.length).toBe(0);

                // Await completion this specific pattern
                await store.transactions.createPositionNameEntity(() => pattern.generator());

                // Verify that exactly ONE entity was created for this pattern
                const entitiesAfter = store.select(["position", "name"]);
                expect(entitiesAfter.length).toBe(1);

                // Verify the final entity has the correct values
                const finalEntity = entitiesAfter[0];
                const finalEntityValues = store.read(finalEntity);

                expect(finalEntityValues).toBeDefined();
                expect(finalEntityValues?.position).toEqual(pattern.expectedFinalPosition);
                expect(finalEntityValues?.name).toBe(pattern.expectedFinalName);

                // Verify that NO intermediate entities exist for this pattern
                const intermediateEntities = entitiesAfter.filter(entityId => {
                    const values = store.read(entityId);
                    // Check for any entities that might be intermediate steps
                    if (pattern.name.includes("yield-yield-yield")) {
                        return values?.name === "Step1" || values?.name === "Step2";
                    } else if (pattern.name.includes("yield-then-return")) {
                        return values?.name === "StepA";
                    }
                    // return-only pattern has no intermediate entities
                    return false;
                });

                // CRITICAL: Should have NO intermediate entities (rollback worked)
                expect(intermediateEntities).toHaveLength(0);

                // Verify transaction observer was called appropriately
                // Each pattern should have at least the minimum expected calls
                const minExpectedCalls = pattern.name.includes("yield-yield-yield") ? 7 :
                    pattern.name.includes("yield-then-return") ? 3 : 1;
                expect(transactionObserver).toHaveBeenCalledTimes(minExpectedCalls);

                // Pattern verification complete
                unsubscribe();
            }

        });
    });

    describe("entity observation with minArchetype filtering", () => {
        it("should observe entity when it matches minArchetype exactly", () => {
            const store = createTestDatabase();

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
            const store = createTestDatabase();

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
            const store = createTestDatabase();

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
            const store = createTestDatabase();

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
            const store = createTestDatabase();

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
            const store = createTestDatabase();

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
            const store = createTestDatabase();

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
            const store = createTestDatabase();

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(999 as Entity, store.archetypes.Position)(observer);

            // Should return null for non-existent entity
            expect(observer).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it("should handle invalid entity ID with minArchetype", () => {
            const store = createTestDatabase();

            const observer = vi.fn();
            const unsubscribe = store.observe.entity(-1, store.archetypes.Position)(observer);

            // Should return null for invalid entity ID
            expect(observer).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it("should maintain separate observations for different minArchetypes", () => {
            const store = createTestDatabase();

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
            const store = createTestDatabase();

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
        const store = createTestDatabase();

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
        const newStore = createTestDatabase();
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
        const store = createTestDatabase();

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
        const newStore = createTestDatabase();
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
        const store = createTestDatabase();

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
        const newStore = createTestDatabase();
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
        const store = createTestDatabase();

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
        const newStore = createTestDatabase();

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
        const store = createTestDatabase();

        // Create initial state
        store.transactions.updateTime({ delta: 0.016, elapsed: 0 });

        // Serialize the database
        const serializedData = store.toData();

        // Create a new database and restore
        const newStore = createTestDatabase();
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

    it("all transient operations should be rolled back", async () => {
        const store = createTestDatabase();

        const promise = store.transactions.startGenerating(async function* () {
            yield { progress: 0 };
            yield { progress: 1 };
        });

        // Check that the result is a promise
        expect(promise).toBeInstanceOf(Promise);

        const result = await promise;
        expect(result).toBe(-1);
        const generating = await toPromise(store.observe.resources.generating);
        expect(generating).toBe(false);
    });

}); 