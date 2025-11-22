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
});

