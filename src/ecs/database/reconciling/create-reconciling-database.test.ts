import { describe, it, expect } from "vitest";
import { createReconcilingDatabase } from "./create-reconciling-database.js";
import { createStore } from "../../store/create-store.js";

const createTestReconcilingDatabase = () => {
    const store = createStore(
        {
            position: {
                type: "object",
                properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                    z: { type: "number" },
                },
                required: ["x", "y", "z"],
                additionalProperties: false,
            },
            name: { type: "string" },
        } as const,
        {},
        {
            PositionNameEntity: ["position", "name"],
        } as const,
    );

    type StoreType = typeof store;

    const transactions = {
        createPositionNameEntity(
            t: StoreType,
            args: { position: { x: number; y: number; z: number }; name: string },
        ) {
            return t.archetypes.PositionNameEntity.insert(args);
        },
        updatePositionNameEntity(
            t: StoreType,
            args: { entity: number; name: string },
        ) {
            t.update(args.entity, { name: args.name });
        },
    };

    return createReconcilingDatabase(store, transactions);
};

const readEntityNames = (reconciling: ReturnType<typeof createTestReconcilingDatabase>) =>
    reconciling
        .select(["name"])
        .map(entity => reconciling.read(entity)?.name)
        .filter((name): name is string => Boolean(name));

describe("createReconcilingDatabase", () => {
    it("replaces a transient entry when the same id yields again", () => {
        const reconciling = createTestReconcilingDatabase();

        reconciling.apply({
            id: 1,
            name: "createPositionNameEntity",
            args: { position: { x: 0, y: 0, z: 0 }, name: "First" },
            time: -1,
        });

        reconciling.apply({
            id: 1,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "Second" },
            time: -2,
        });

        expect(readEntityNames(reconciling)).toEqual(["Second"]);

        const serialized = reconciling.toData() as { appliedEntries?: Array<{ args: unknown }> };
        expect(serialized.appliedEntries).toHaveLength(1);
        expect(serialized.appliedEntries?.[0]?.args).toEqual({ position: { x: 1, y: 1, z: 1 }, name: "Second" });
    });

    it("removes a transient entry when cancelled after other operations", () => {
        const reconciling = createTestReconcilingDatabase();

        reconciling.apply({
            id: 10,
            name: "createPositionNameEntity",
            args: { position: { x: 0, y: 0, z: 0 }, name: "Transient" },
            time: -1,
        });

        reconciling.apply({
            id: 11,
            name: "createPositionNameEntity",
            args: { position: { x: 5, y: 5, z: 5 }, name: "Committed" },
            time: 2,
        });

        const serializedBefore = reconciling.toData() as { appliedEntries?: Array<{ id?: number }> };
        expect(serializedBefore.appliedEntries).toHaveLength(1);

        reconciling.cancel(10);

        expect(readEntityNames(reconciling)).toEqual(["Committed"]);
        const serializedAfter = reconciling.toData() as { appliedEntries?: Array<{ id?: number }> };
        expect(serializedAfter.appliedEntries ?? []).toHaveLength(0);
    });

    it("clears transient state after commit confirmation", () => {
        const reconciling = createTestReconcilingDatabase();

        reconciling.apply({
            id: 21,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 2, z: 3 }, name: "InFlight" },
            time: -1,
        });

        reconciling.apply({
            id: 21,
            name: "createPositionNameEntity",
            args: { position: { x: 4, y: 5, z: 6 }, name: "Final" },
            time: 5,
        });

        expect(readEntityNames(reconciling)).toEqual(["Final"]);
        const serialized = reconciling.toData() as { appliedEntries?: Array<{ time: number }> };
        expect(serialized.appliedEntries ?? []).toHaveLength(0);
    });

    it("prunes committed entries from memory", () => {
        const reconciling = createTestReconcilingDatabase();

        // Apply multiple committed entries
        reconciling.apply({
            id: 30,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "First" },
            time: 100,
        });

        reconciling.apply({
            id: 31,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "Second" },
            time: 200,
        });

        reconciling.apply({
            id: 32,
            name: "createPositionNameEntity",
            args: { position: { x: 3, y: 3, z: 3 }, name: "Third" },
            time: 300,
        });

        // All entities should be created
        expect(readEntityNames(reconciling)).toEqual(["First", "Second", "Third"]);

        // But no entries should be kept in memory since they're all committed
        const serialized = reconciling.toData() as { appliedEntries?: Array<unknown> };
        expect(serialized.appliedEntries ?? []).toHaveLength(0);
    });

    it("keeps transient entries but prunes committed ones", () => {
        const reconciling = createTestReconcilingDatabase();

        // Apply committed entry
        reconciling.apply({
            id: 40,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "Committed" },
            time: 100,
        });

        // Apply transient entry
        reconciling.apply({
            id: 41,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "Transient" },
            time: -200,
        });

        expect(readEntityNames(reconciling)).toEqual(["Committed", "Transient"]);

        // Only the transient entry should be serialized
        const serialized = reconciling.toData() as { appliedEntries?: Array<{ id: number; name: string }> };
        expect(serialized.appliedEntries).toHaveLength(1);
        expect(serialized.appliedEntries?.[0]?.id).toBe(41);
    });

    it("removes transient entry from queue when cancelled", () => {
        const reconciling = createTestReconcilingDatabase();

        // Apply a transient entry
        reconciling.apply({
            id: 50,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "InProgress" },
            time: -100,
        });

        // Verify the transient entry is in the queue
        const serializedBefore = reconciling.toData() as { appliedEntries?: Array<{ id: number; name: string }> };
        expect(serializedBefore.appliedEntries).toHaveLength(1);
        expect(serializedBefore.appliedEntries?.[0]?.id).toBe(50);
        expect(readEntityNames(reconciling)).toEqual(["InProgress"]);

        // Cancel the transient entry (simulating an error in sequential transaction)
        reconciling.apply({
            id: 50,
            name: "createPositionNameEntity",
            args: undefined,
            time: 0,
        });

        // Verify the entry is removed from the queue
        const serializedAfter = reconciling.toData() as { appliedEntries?: Array<unknown> };
        expect(serializedAfter.appliedEntries ?? []).toHaveLength(0);
        
        // Verify the entity state is rolled back
        expect(readEntityNames(reconciling)).toEqual([]);
    });

    it("removes multiple transient updates when sequential transaction is cancelled", () => {
        const reconciling = createTestReconcilingDatabase();

        // Simulate sequential transaction with multiple yields (updates)
        // Each yield replaces the previous transient state
        reconciling.apply({
            id: 60,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "Update1" },
            time: -100,
        });

        reconciling.apply({
            id: 60,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "Update2" },
            time: -101,
        });

        reconciling.apply({
            id: 60,
            name: "createPositionNameEntity",
            args: { position: { x: 3, y: 3, z: 3 }, name: "Update3" },
            time: -102,
        });

        // Verify the latest transient state exists
        const serializedBefore = reconciling.toData() as { appliedEntries?: Array<{ id: number; args: unknown }> };
        expect(serializedBefore.appliedEntries).toHaveLength(1);
        expect(serializedBefore.appliedEntries?.[0]?.id).toBe(60);
        expect((serializedBefore.appliedEntries?.[0]?.args as any)?.name).toBe("Update3");
        expect(readEntityNames(reconciling)).toEqual(["Update3"]);

        // Cancel (simulating error during sequential transaction)
        reconciling.apply({
            id: 60,
            name: "createPositionNameEntity",
            args: undefined,
            time: 0,
        });

        // Verify complete removal from queue
        const serializedAfter = reconciling.toData() as { appliedEntries?: Array<unknown> };
        expect(serializedAfter.appliedEntries ?? []).toHaveLength(0);
        
        // Verify all state is rolled back
        expect(readEntityNames(reconciling)).toEqual([]);
    });

    it("should correctly handle inserting at the end without rolling back the new entry", () => {
        const reconciling = createTestReconcilingDatabase();

        // Create two committed entries
        reconciling.apply({
            id: 70,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "First" },
            time: 100,
        });

        reconciling.apply({
            id: 71,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "Second" },
            time: 200,
        });

        // Now insert a new entry at the end (time > 200)
        reconciling.apply({
            id: 72,
            name: "createPositionNameEntity",
            args: { position: { x: 3, y: 3, z: 3 }, name: "Third" },
            time: 300,
        });

        // All three should exist in order
        expect(readEntityNames(reconciling)).toEqual(["First", "Second", "Third"]);
    });

    it("should correctly handle inserting in the middle by rolling back only affected entries", () => {
        const reconciling = createTestReconcilingDatabase();

        // Create entries with times 100 and 300
        reconciling.apply({
            id: 80,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "Early" },
            time: 100,
        });

        reconciling.apply({
            id: 81,
            name: "createPositionNameEntity",
            args: { position: { x: 3, y: 3, z: 3 }, name: "Late" },
            time: 300,
        });

        expect(readEntityNames(reconciling)).toEqual(["Early", "Late"]);

        // Now insert an entry in the middle with time 200
        // This should cause "Late" to be rolled back and replayed
        reconciling.apply({
            id: 82,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "Middle" },
            time: 200,
        });

        // Should be in time order
        expect(readEntityNames(reconciling)).toEqual(["Early", "Middle", "Late"]);
    });

    it("should not attempt to rollback a newly inserted entry that has no result yet", () => {
        const reconciling = createTestReconcilingDatabase();

        // Track how many times each transaction is executed
        const executionLog: string[] = [];
        
        // Use updatePositionNameEntity which we can track
        const entities: number[] = [];

        // Create first entity
        const result1 = reconciling.apply({
            id: 90,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "Entity1" },
            time: 100,
        });
        entities.push(result1!.value as number);

        // Create second entity
        const result2 = reconciling.apply({
            id: 91,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "Entity2" },
            time: 200,
        });
        entities.push(result2!.value as number);

        // Verify both exist
        expect(readEntityNames(reconciling)).toEqual(["Entity1", "Entity2"]);

        // Now create a third entity with time after both
        // The bug would be: we try to rollback this new entry before it has a result
        const result3 = reconciling.apply({
            id: 92,
            name: "createPositionNameEntity",
            args: { position: { x: 3, y: 3, z: 3 }, name: "Entity3" },
            time: 300,
        });
        entities.push(result3!.value as number);

        // All three should exist
        expect(readEntityNames(reconciling)).toEqual(["Entity1", "Entity2", "Entity3"]);

        // Verify the entities actually have the correct data
        const entity1Data = reconciling.read(entities[0]);
        const entity2Data = reconciling.read(entities[1]);
        const entity3Data = reconciling.read(entities[2]);

        expect(entity1Data?.name).toBe("Entity1");
        expect(entity2Data?.name).toBe("Entity2");
        expect(entity3Data?.name).toBe("Entity3");
    });

    it("should handle replacing an entry that moves forward in the queue", () => {
        const reconciling = createTestReconcilingDatabase();

        // Create transient entry at time -100
        reconciling.apply({
            id: 100,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "Transient" },
            time: -100,
        });

        // Create committed entry at time 50 (earlier than transient absolute time)
        reconciling.apply({
            id: 101,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "Early" },
            time: 50,
        });

        expect(readEntityNames(reconciling)).toEqual(["Early", "Transient"]);

        // Now commit the transient entry with time 200 (should move it forward)
        reconciling.apply({
            id: 100,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "TransientCommitted" },
            time: 200,
        });

        expect(readEntityNames(reconciling)).toEqual(["Early", "TransientCommitted"]);
    });

    it("should handle replacing an entry that moves backward in the queue", () => {
        const reconciling = createTestReconcilingDatabase();

        // Create committed entry at time 200
        reconciling.apply({
            id: 110,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "Late" },
            time: 200,
        });

        // Create another committed entry at time 300
        reconciling.apply({
            id: 111,
            name: "createPositionNameEntity",
            args: { position: { x: 3, y: 3, z: 3 }, name: "Latest" },
            time: 300,
        });

        expect(readEntityNames(reconciling)).toEqual(["Late", "Latest"]);

        // Now update the second entry to have an earlier time (moves backward)
        reconciling.apply({
            id: 111,
            name: "createPositionNameEntity",
            args: { position: { x: 3, y: 3, z: 3 }, name: "LatestUpdated" },
            time: 150,
        });

        expect(readEntityNames(reconciling)).toEqual(["LatestUpdated", "Late"]);
    });

    it("verifies correct rollback-then-insert-then-replay order", () => {
        const reconciling = createTestReconcilingDatabase();
        
        // This test verifies that the rollback happens BEFORE insertion
        // The logic is now:
        // 1. rollbackRange(insertIndex) - rollback affected entries BEFORE inserting
        // 2. splice(insertIndex, 0, newEntry) - insert the new entry
        // 3. replayRange(insertIndex) - replay from insertion point including new entry
        
        // Create two entries
        reconciling.apply({
            id: 120,
            name: "createPositionNameEntity",
            args: { position: { x: 1, y: 1, z: 1 }, name: "A" },
            time: 100,
        });

        reconciling.apply({
            id: 121,
            name: "createPositionNameEntity",
            args: { position: { x: 2, y: 2, z: 2 }, name: "B" },
            time: 200,
        });

        // Insert at the end - now correctly:
        // 1. rollbackRange(2) - nothing to rollback (at end of current array)
        // 2. splice(2, 0, newEntry) - insert at position 2
        // 3. replayRange(2) - replay the new entry only
        
        reconciling.apply({
            id: 122,
            name: "createPositionNameEntity",
            args: { position: { x: 3, y: 3, z: 3 }, name: "C" },
            time: 300,
        });

        // Verify correct final state
        expect(readEntityNames(reconciling)).toEqual(["A", "B", "C"]);
    });
});

