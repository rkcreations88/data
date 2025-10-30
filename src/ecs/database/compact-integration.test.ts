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
import { createDatabase } from "./create-database.js";
import { createStore } from "../store/create-store.js";
import { TupleSchema } from "../../schema/tuple.js";
import { F32Schema } from "../../schema/f32.js";
import { U32Schema } from "../../schema/u32.js";

const positionSchema = TupleSchema([F32Schema, F32Schema, F32Schema]);
const healthSchema = TupleSchema([U32Schema, U32Schema]);

describe("Database compact() integration test", () => {
    it("should reduce JSON serialization size after compacting deleted entities", () => {
        const store = createStore(
            {
                position: positionSchema,
                health: healthSchema,
            },
            {
                time: { default: { delta: 0.016, elapsed: 0 } }
            }
        );

        const database = createDatabase(store, {
            createEntity: () => (args: { position: { x: number, y: number, z: number }, health: { current: number, max: number } }) => {
                const archetype = store.ensureArchetype(["id", "position", "health"]);
                return archetype.insert({
                    position: args.position,
                    health: args.health
                });
            },
            deleteEntity: () => (args: { entity: number }) => {
                store.delete(args.entity);
            }
        });

        // Create many entities to cause buffer growth
        const entities = [];
        for (let i = 0; i < 50; i++) {
            const entity = database.transactions.createEntity({
                position: { x: i, y: i * 2, z: i * 3 },
                health: { current: 100, max: 100 }
            });
            entities.push(entity);
        }

        // Delete most of them
        for (let i = 5; i < 50; i++) {
            database.transactions.deleteEntity({ entity: entities[i] });
        }

        // Serialize before compact
        const dataBeforeCompact = database.toData();
        const jsonBeforeCompact = JSON.stringify(dataBeforeCompact);
        const sizeBeforeCompact = jsonBeforeCompact.length;

        // Compact and serialize
        database.compact();
        const dataAfterCompact = database.toData();
        const jsonAfterCompact = JSON.stringify(dataAfterCompact);
        const sizeAfterCompact = jsonAfterCompact.length;

        // Verify compaction reduced size
        expect(sizeAfterCompact).toBeLessThan(sizeBeforeCompact);

        // Verify data integrity - should still have 5 entities
        const remainingEntities = database.select(["position", "health"]);
        expect(remainingEntities).toHaveLength(5);

        // Verify the remaining entities have correct data
        for (let i = 0; i < 5; i++) {
            const entity = entities[i];
            const data = database.read(entity);
            expect(data?.position).toEqual({ x: i, y: i * 2, z: i * 3 });
            expect(data?.health).toEqual({ current: 100, max: 100 });
        }
    });

    it("should maintain data integrity after compact and restore", () => {
        const createTestDatabase = () => createDatabase(
            createStore(
                { position: positionSchema },
                { time: { default: { delta: 0.016, elapsed: 0 } } }
            ),
            {
                createEntity: () => (args: { position: { x: number, y: number, z: number } }) => {
                    const archetype = createTestDatabase().ensureArchetype(["id", "position"]);
                    return archetype.insert({ position: args.position });
                },
            }
        );

        const db1 = createTestDatabase();

        // Create and delete entities
        const e1 = db1.transactions.createEntity({ position: { x: 1, y: 2, z: 3 } });
        const e2 = db1.transactions.createEntity({ position: { x: 4, y: 5, z: 6 } });
        const e3 = db1.transactions.createEntity({ position: { x: 7, y: 8, z: 9 } });
        const e4 = db1.transactions.createEntity({ position: { x: 10, y: 11, z: 12 } });

        db1.delete(e2);
        db1.delete(e4);

        // Compact and serialize
        db1.compact();
        const compactedData = db1.toData();

        // Restore to new database
        const db2 = createTestDatabase();
        db2.fromData(compactedData);

        // Verify restored data
        const entities = db2.select(["position"]);
        expect(entities).toHaveLength(2);

        const data1 = db2.read(e1);
        const data3 = db2.read(e3);

        expect(data1?.position).toEqual({ x: 1, y: 2, z: 3 });
        expect(data3?.position).toEqual({ x: 7, y: 8, z: 9 });
    });

    it("should work with empty database", () => {
        const store = createStore({ position: positionSchema });
        const database = createDatabase(store, {});

        expect(() => database.compact()).not.toThrow();

        const data = database.toData();
        expect(data).toBeDefined();
    });
});

