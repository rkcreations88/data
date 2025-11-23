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

import { describe, expect, test, vi } from "vitest";
import { createStore } from "../store/create-store.js";
import { createDatabase } from "./create-database.js";
import { replicate, type ReplicateOptions } from "./replicate.js";
import { Schema } from "../../schema/schema.js";
import { Entity } from "../entity.js";

const vectorSchema = {
    type: "object",
    properties: {
        x: { type: "number" },
        y: { type: "number" },
        z: { type: "number" },
    },
    required: ["x", "y", "z"],
    additionalProperties: false,
} as const satisfies Schema;

const labelSchema = {
    type: "string",
    maxLength: 64,
} as const satisfies Schema;

const counterSchema = {
    type: "number",
    default: 0,
} as const satisfies Schema;

type Position = { readonly x: number; readonly y: number; readonly z: number };

const sourceComponents = {
    position: vectorSchema,
    label: labelSchema,
} as const;

const resourceSchemas = {
    counter: counterSchema,
} as const;

const archetypeComponents = {
    Mover: ["position"],
} as const;

const targetComponents = {
    ...sourceComponents,
    tint: {
        type: "number",
        default: 0,
    },
} as const;

interface TestContext {
    readonly createMover: (position: Position) => Entity;
    readonly mutateEntity: (entity: Entity, values: Partial<{ position: Position; label: string }>) => void;
    readonly deleteEntity: (entity: Entity) => void;
    readonly setCounter: (value: number) => void;
    readonly dispose: () => void;
    readonly sourceRead: (entity: Entity) => Record<string, unknown> | null;
    readonly targetRead: (entity: Entity) => Record<string, unknown> | null;
    readonly sourceToTarget: Map<Entity, Entity>;
    readonly targetStore: TargetStore;
}

const makeSourceStore = () => createStore(sourceComponents, resourceSchemas, archetypeComponents);
const makeTargetStore = () => createStore(targetComponents, resourceSchemas, archetypeComponents);

type TargetStore = ReturnType<typeof makeTargetStore>;

const createTestContext = (options: ReplicateOptions<object, object> = {}): TestContext => {
    const sourceStore = makeSourceStore();
    const database = createDatabase(sourceStore, {
        createMover(t, { position }: { position: Position }) {
            return t.archetypes.Mover.insert({ position });
        },
        mutateEntity(t, { entity, values }: { entity: Entity; values: Partial<{ position: Position; label: string }> }) {
            t.update(entity, values);
        },
        deleteEntity(t, { entity }: { entity: Entity }) {
            t.delete(entity);
        },
        setCounter(t, value: number) {
            t.resources.counter = value;
        },
    });

    const targetStore = makeTargetStore();
    const replication = replicate(database, targetStore, options);

    return {
        createMover: (position) => database.transactions.createMover({ position }),
        mutateEntity: (entity, values) => {
            database.transactions.mutateEntity({ entity, values });
        },
        deleteEntity: (entity) => database.transactions.deleteEntity({ entity }),
        setCounter: (value) => {
            database.transactions.setCounter(value);
        },
        dispose: replication.dispose,
        sourceRead: (entity) => database.read(entity),
        targetRead: (entity) => targetStore.read(entity),
        sourceToTarget: replication.entityMap,
        targetStore,
    };
};

const expectPosition = (value: unknown, position: Position) => {
    expect(value).toEqual(position);
};

describe("replicate", () => {
    test("creates matching entity on insert transactions", () => {
        const context = createTestContext();
        const position = { x: 1, y: 2, z: 3 };
        const sourceEntity = context.createMover(position);

        const targetEntity = context.sourceToTarget.get(sourceEntity);
        expect(targetEntity).toBeDefined();

        const replicated = targetEntity ? context.targetRead(targetEntity) : null;
        expect(replicated).not.toBeNull();
        expectPosition(replicated?.position, position);

        context.dispose();
    });

    test("updates existing target entity with component changes", () => {
        const context = createTestContext();
        const sourceEntity = context.createMover({ x: 0, y: 0, z: 0 });
        const initialTargetEntity = context.sourceToTarget.get(sourceEntity);
        expect(initialTargetEntity).toBeDefined();

        context.mutateEntity(sourceEntity, { position: { x: 5, y: 6, z: 7 } });
        const targetEntity = initialTargetEntity ? context.sourceToTarget.get(sourceEntity) : undefined;
        expect(targetEntity).toBeDefined();
        const updated = targetEntity ? context.targetRead(targetEntity) : null;
        expect(updated?.position).toEqual({ x: 5, y: 6, z: 7 });

        context.mutateEntity(sourceEntity, { label: "runner" });
        const labeled = targetEntity ? context.targetRead(targetEntity) : null;
        expect(labeled?.label).toBe("runner");

        context.mutateEntity(sourceEntity, { label: undefined });
        const unlabeled = targetEntity ? context.targetRead(targetEntity) : null;
        expect(unlabeled).not.toBeNull();
        expect("label" in (unlabeled ?? {})).toBe(false);

        context.dispose();
    });

    test("throws when target entity is missing during update", () => {
        const context = createTestContext();
        const sourceEntity = context.createMover({ x: 10, y: 20, z: 30 });
        const targetEntity = context.sourceToTarget.get(sourceEntity);
        expect(targetEntity).toBeDefined();
        const missingTarget = targetEntity!;
        context.targetStore.delete(missingTarget);
        expect(context.targetRead(missingTarget)).toBeNull();

        expect(() => {
            context.mutateEntity(sourceEntity, { position: { x: 11, y: 21, z: 31 } });
        }).toThrowError(/Target entity missing/);

        context.dispose();
    });

    test("deletes corresponding target entity", () => {
        const context = createTestContext();
        const sourceEntity = context.createMover({ x: 1, y: 1, z: 1 });
        const targetEntity = context.sourceToTarget.get(sourceEntity);
        expect(targetEntity).toBeDefined();

        context.deleteEntity(sourceEntity);

        expect(context.sourceToTarget.has(sourceEntity)).toBe(false);
        const replicated = targetEntity ? context.targetRead(targetEntity) : null;
        expect(replicated).toBeNull();

        context.dispose();
    });

    test("does not affect extra entities present only in target store", () => {
        const context = createTestContext();
        const targetArchetype = context.targetStore.ensureArchetype(["id", "position"]);
        const extraEntity = targetArchetype.insert({ position: { x: 99, y: 99, z: 99 } });

        const sourceEntity = context.createMover({ x: 2, y: 3, z: 4 });
        context.deleteEntity(sourceEntity);

        const extraAfter = context.targetRead(extraEntity);
        expect(extraAfter).not.toBeNull();

        context.dispose();
    });

    test("replicates resource updates", () => {
        const context = createTestContext();
        expect(context.targetStore.resources.counter).toBe(0);

        context.setCounter(42);

        expect(context.targetStore.resources.counter).toBe(42);

        context.dispose();
    });

    test("invokes callbacks after writes", () => {
        const onCreate = vi.fn();
        const onUpdate = vi.fn();
        const onDelete = vi.fn();
        const context = createTestContext({ onCreate, onUpdate, onDelete });
        const position = { x: 3, y: 4, z: 5 };
        const sourceEntity = context.createMover(position);
        const targetEntity = context.sourceToTarget.get(sourceEntity);
        expect(targetEntity).toBeDefined();
        const target = targetEntity!;

        expect(onCreate).toHaveBeenCalledTimes(1);
        expect(onCreate).toHaveBeenCalledWith({
            source: sourceEntity,
            target,
            values: { position },
        });

        context.mutateEntity(sourceEntity, { label: "runner" });
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenLastCalledWith({
            source: sourceEntity,
            target,
            changes: { label: "runner" },
        });

        context.mutateEntity(sourceEntity, { label: undefined });
        expect(onUpdate).toHaveBeenCalledTimes(2);
        expect(onUpdate).toHaveBeenLastCalledWith({
            source: sourceEntity,
            target,
            changes: { label: undefined },
        });

        context.deleteEntity(sourceEntity);
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledWith({
            source: sourceEntity,
            target,
            oldValues: { position },
        });

        context.dispose();
    });
});

