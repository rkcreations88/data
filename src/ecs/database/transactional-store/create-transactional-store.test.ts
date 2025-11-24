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
import { describe, it, expect } from "vitest";
import { createTransactionalStore } from "./create-transactional-store.js";
import { createStore } from "../../store/create-store.js";
import { F32Schema } from "../../../schema/f32.js";
import { Schema } from "../../../schema/schema.js";

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

const healthSchema = {
    type: "object",
    properties: {
        current: F32Schema,
        max: F32Schema,
    },
    required: ["current", "max"],
    additionalProperties: false,
} as const satisfies Schema;

describe("createTransactionalStore", () => {
    it("should create transactional store with basic components", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { default: { delta: 0.016, elapsed: 0 } } }
        );

        const store = createTransactionalStore(baseStore);

        expect(store).toBeDefined();
        expect(store.componentSchemas).toHaveProperty("id");
        expect(store.componentSchemas).toHaveProperty("position");
        expect(store.componentSchemas).toHaveProperty("health");
        expect(store.resources).toHaveProperty("time");
    });

    it("should execute transactions successfully", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { default: { delta: 0.016, elapsed: 0 } } }
        );

        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            // Create an entity
            const archetype = transactionStore.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            // Update the entity
            transactionStore.update(entity, { position: { x: 10, y: 20, z: 30 } });

            // Update resources
            transactionStore.resources.time = { delta: 0.032, elapsed: 1 };
        });

        expect(result).toBeDefined();
        expect(result.redo).toHaveLength(3); // insert + update
        expect(result.undo).toHaveLength(3); // delete + insert with old values
        expect(result.changedEntities.size).toBe(2);
        expect(result.changedComponents.size).toBe(2); // position
        expect(result.changedArchetypes.size).toBe(2);
    });

    it("should rollback on error", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { default: { delta: 0.016, elapsed: 0 } } }
        );

        const store = createTransactionalStore(baseStore);

        // Create initial entity in a transaction
        let entity: number = -1;
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position"]);
            entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });
        });

        // Verify initial state
        const initialData = store.read(entity);
        expect(initialData?.position).toEqual({ x: 1, y: 2, z: 3 });

        // Execute transaction that throws an error
        expect(() => {
            store.execute((transactionStore) => {
                // Update entity
                transactionStore.update(entity, { position: { x: 10, y: 20, z: 30 } });

                // This should cause rollback
                throw new Error("Transaction failed");
            });
        }).toThrow("Transaction failed");

        // Verify rollback occurred
        const finalData = store.read(entity);
        expect(finalData?.position).toEqual({ x: 1, y: 2, z: 3 });
    });

    it("should combine multiple updates to the same entity", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { default: { delta: 0.016, elapsed: 0 } } }
        );

        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            const entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            // Multiple updates to the same entity should be combined
            transactionStore.update(entity, { position: { x: 10, y: 20, z: 30 } });
            transactionStore.update(entity, { health: { current: 50, max: 100 } });
        });

        // Should have combined updates
        expect(result.redo).toHaveLength(2); // insert + combined update
        expect(result.undo).toHaveLength(2); // delete + insert with old values

        const updateOperation = result.redo.find(op => op.type === "update");
        expect(updateOperation?.type).toBe("update");
        if (updateOperation?.type === "update") {
            expect(updateOperation.values).toHaveProperty("position");
            expect(updateOperation.values).toHaveProperty("health");
        }
    });

    it("should track changed entities, components, and archetypes", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { default: { delta: 0.016, elapsed: 0 } } }
        );

        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            // Create entities in different archetypes
            const posArchetype = transactionStore.ensureArchetype(["id", "position"]);
            const healthArchetype = transactionStore.ensureArchetype(["id", "health"]);

            const entity1 = posArchetype.insert({ position: { x: 1, y: 2, z: 3 } });
            const entity2 = healthArchetype.insert({ health: { current: 100, max: 100 } });

            // Update resources
            transactionStore.resources.time = { delta: 0.032, elapsed: 1 };
        });

        expect(result.changedEntities.size).toBe(3);
        expect(result.changedComponents.size).toBe(3); // position, health
        expect(result.changedArchetypes.size).toBe(3); // two different archetypes
    });

    it("should preserve base store functionality", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { default: { delta: 0.016, elapsed: 0 } } }
        );

        const store = createTransactionalStore(baseStore);

        // Verify all base store methods are available
        expect(store.componentSchemas).toBeDefined();
        expect(store.resources).toBeDefined();
        expect(store.queryArchetypes).toBeDefined();
        expect(store.read).toBeDefined();
        expect(store.execute).toBeDefined();

        // Verify we can use the store normally for read operations
        const archetypes = store.queryArchetypes(["id"]);
        expect(archetypes.length).toBeGreaterThan(0);

        // Verify we can create entities through transactions
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });
            expect(store.read(entity)).toBeDefined();
        });
    });

    it("should support transient transactions", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { default: { delta: 0.016, elapsed: 0 } } }
        );

        const store = createTransactionalStore(baseStore);

        // Execute a regular transaction (non-transient)
        const regularResult = store.execute((t) => {
            const archetype = t.ensureArchetype(["id", "position"]);
            archetype.insert({ position: { x: 1, y: 2, z: 3 } });
        });

        expect(regularResult.transient).toBe(false);

        // Execute a transient transaction
        const transientResult = store.execute((t) => {
            const archetype = t.ensureArchetype(["id", "position"]);
            archetype.insert({ position: { x: 10, y: 20, z: 30 } });
        }, { transient: true });

        expect(transientResult.transient).toBe(true);
    });

    it("should track specific components and archetypes when creating entities", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {},
            {
                PositionHealth: ["position", "health"]
            }
        );
        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            return transactionStore.archetypes.PositionHealth.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            })
        });
        expect(result.changedEntities).toEqual(new Map([[result.value, { position: { x: 1, y: 2, z: 3 }, health: { current: 100, max: 100 } }]]));
        expect(result.changedComponents).toEqual(new Set(["position", "health"]));
        expect(result.changedArchetypes).toEqual(new Set([store.archetypes.PositionHealth.id]));
    });

    it("should track changedEntities as Map with combined values for multiple updates", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            const entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            // Multiple updates to the same entity
            transactionStore.update(entity, { position: { x: 10, y: 20, z: 30 } });
            transactionStore.update(entity, { health: { current: 50, max: 100 } });
            transactionStore.update(entity, { position: { x: 15, y: 25, z: 35 } });

            return entity;
        });

        // Should have combined final values from all updates
        expect(result.value).toBeDefined();
        expect(typeof result.value).toBe('number');
        const entity = result.value as number;
        expect(result.changedEntities).toEqual(new Map([[entity, {
            position: { x: 15, y: 25, z: 35 },
            health: { current: 50, max: 100 }
        }]]));
    });

    it("should track changedEntities as Map with null for deleted entities", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        // First create an entity
        let entity: number;
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });
        });

        // Then delete it in a separate transaction
        const result = store.execute((transactionStore) => {
            transactionStore.delete(entity!);
        });

        // Should have null value for the deleted entity
        expect(result.changedEntities).toEqual(new Map([[entity!, null]]));
    });

    it("should track changedEntities with combined values when entity is updated then deleted", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        // First create an entity
        let entity: number;
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });
        });

        // Then update and delete in the same transaction
        const result = store.execute((transactionStore) => {
            transactionStore.update(entity!, { position: { x: 10, y: 20, z: 30 } });
            transactionStore.update(entity!, { health: { current: 50, max: 100 } });
            transactionStore.delete(entity!);
        });

        // Should have null since the entity was deleted
        expect(result.changedEntities).toEqual(new Map([[entity!, null]]));
    });

    it("should track deleted components in changedComponents when entity is deleted", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        // First create an entity with multiple components
        let entity: number;
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });
        });

        // Then delete it in a separate transaction
        const result = store.execute((transactionStore) => {
            transactionStore.delete(entity!);
        });

        // Should have null value for the deleted entity
        expect(result.changedEntities).toEqual(new Map([[entity!, null]]));

        // Should track the deleted components in changedComponents
        expect(result.changedComponents).toEqual(new Set(["position", "health"]));
    });

    it("should track deleted components when entity is updated then deleted", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        // First create an entity
        let entity: number;
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });
        });

        // Then update and delete in the same transaction
        const result = store.execute((transactionStore) => {
            transactionStore.update(entity!, { position: { x: 10, y: 20, z: 30 } });
            transactionStore.update(entity!, { health: { current: 50, max: 100 } });
            transactionStore.delete(entity!);
        });

        // Should have null since the entity was deleted
        expect(result.changedEntities).toEqual(new Map([[entity!, null]]));

        // Should track all components that were affected (updated and then deleted)
        expect(result.changedComponents).toEqual(new Set(["position", "health"]));
    });

    it("should flag removed components with undefined in changedEntities", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        let entity: number;
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });
        });

        const result = store.execute((transactionStore) => {
            transactionStore.update(entity!, { health: undefined });
        });

        const change = result.changedEntities.get(entity!);
        expect(change).not.toBeNull();
        expect(Object.prototype.hasOwnProperty.call(change ?? {}, "health")).toBe(true);
        expect(change?.health).toBeUndefined();
        expect(result.changedComponents).toEqual(new Set(["health"]));
    });

    it("should track changedEntities with final combined values for complex update sequences", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            const entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            // Complex sequence of updates
            transactionStore.update(entity, { position: { x: 10, y: 20, z: 30 } });
            transactionStore.update(entity, { health: { current: 75, max: 100 } });
            transactionStore.update(entity, { position: { x: 15, y: 25, z: 35 } });
            transactionStore.update(entity, { health: { current: 50, max: 100 } });
            transactionStore.update(entity, { position: { x: 20, y: 30, z: 40 } });

            return entity;
        });

        // Should have the final combined state
        expect(result.changedEntities).toEqual(new Map([[result.value, {
            position: { x: 20, y: 30, z: 40 },
            health: { current: 50, max: 100 }
        }]]));
    });

    it("should track multiple entities with different operations in changedEntities", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);

            // Create first entity
            const entity1 = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            // Create second entity
            const entity2 = archetype.insert({
                position: { x: 10, y: 20, z: 30 },
                health: { current: 200, max: 200 }
            });

            // Update first entity
            transactionStore.update(entity1, { position: { x: 5, y: 6, z: 7 } });

            // Delete second entity
            transactionStore.delete(entity2);

            return entity1;
        });

        // Should have both entities tracked with appropriate values
        expect(result.changedEntities.size).toBe(2);
        expect(result.changedEntities.get(result.value as number)).toEqual({
            position: { x: 5, y: 6, z: 7 },
            health: { current: 100, max: 100 }
        });

        // Find the deleted entity
        const deletedEntity = Array.from(result.changedEntities.entries()).find(([_, values]) => values === null)?.[0];
        expect(deletedEntity).toBeDefined();
        expect(result.changedEntities.get(deletedEntity!)).toBeNull();
    });

    it("should increment .rows property after each insert operation within a transaction", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            {}
        );
        const store = createTransactionalStore(baseStore);

        // Get the archetype before any inserts
        const archetype = baseStore.ensureArchetype(["id", "position"]);
        const initialRows = archetype.rowCount;

        store.execute((transactionStore) => {
            const transactionArchetype = transactionStore.ensureArchetype(["id", "position"]);

            // First insert - rows should be incremented
            const entity1 = transactionArchetype.insert({
                position: { x: 1, y: 2, z: 3 }
            });
            expect(transactionArchetype.rowCount).toBe(initialRows + 1);

            // Second insert - rows should be incremented again
            const entity2 = transactionArchetype.insert({
                position: { x: 10, y: 20, z: 30 }
            });
            expect(transactionArchetype.rowCount).toBe(initialRows + 2);

            // Third insert - rows should be incremented again
            const entity3 = transactionArchetype.insert({
                position: { x: 100, y: 200, z: 300 }
            });
            expect(transactionArchetype.rowCount).toBe(initialRows + 3);
        });

        // After transaction, the base store should also reflect the changes
        expect(archetype.rowCount).toBe(initialRows + 3);
    });
}); 