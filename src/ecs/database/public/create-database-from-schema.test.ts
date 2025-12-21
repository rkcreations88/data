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
import { Database } from "../database.js";
import { Store } from "../../store/index.js";
import { F32 } from "../../../math/f32/index.js";

describe("Database.create from schema", () => {
    it("should create and use database from Database.Schema", () => {
        const databaseSchema = Database.Schema.create({
            components: {
                position: {
                    type: "object",
                    properties: {
                        x: F32.schema,
                        y: F32.schema,
                        z: F32.schema,
                    },
                    required: ["x", "y", "z"],
                    additionalProperties: false,
                } as const,
            },
            resources: {
                time: { default: { delta: 0.016, elapsed: 0 } as { delta: number; elapsed: number } },
            },
            archetypes: {
                PositionEntity: ["position"],
            },
            transactions: {
                createPositionEntity(t, args: { position: { x: number; y: number; z: number } }) {
                    return t.archetypes.PositionEntity.insert(args);
                },
                updateTime(t, args: { delta: number; elapsed: number }) {
                    t.resources.time = args;
                },
            }
        });

        const database = Database.create(databaseSchema);

        const entity = database.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 },
        });

        expect(entity).toBeDefined();
        expect(typeof entity).toBe("number");

        const entityData = database.read(entity);
        expect(entityData).toEqual({
            id: entity,
            position: { x: 1, y: 2, z: 3 },
        });

        database.transactions.updateTime({ delta: 0.033, elapsed: 1.5 });
        expect(database.resources.time).toEqual({ delta: 0.033, elapsed: 1.5 });

        const entities = database.select(["position"]);
        expect(entities).toHaveLength(1);
        expect(entities[0]).toBe(entity);
    });

    it("should extend database with new actions", () => {
        const databaseSchema = Database.Schema.create({
            components: {
                position: {
                    type: "object",
                    properties: {
                        x: F32.schema,
                        y: F32.schema,
                        z: F32.schema,
                    },
                    required: ["x", "y", "z"],
                    additionalProperties: false,
                } as const,
            },
            resources: {
                foo: { default: 0 as number }
            },
            archetypes: {
                PositionEntity: ["position"],
            },
            transactions: {
                createPositionEntity(t, args: { position: { x: number; y: number; z: number } }) {
                    return t.archetypes.PositionEntity.insert(args);
                },
            }
        });

        const database = Database.create(databaseSchema);

        const extensionSchema = {
            components: {
                velocity: {
                    type: "object",
                    properties: {
                        x: F32.schema,
                        y: F32.schema,
                        z: F32.schema,
                    },
                    required: ["x", "y", "z"],
                    additionalProperties: false,
                } as const,
            },
            resources: {},
            archetypes: {
                MovingEntity: ["position", "velocity"],
            },
            transactions: {
                createMovingEntity(t: Store<any, any, any>, args: { position: { x: number; y: number; z: number }; velocity: { x: number; y: number; z: number } }) {
                    return (t.archetypes as any).MovingEntity.insert(args);
                },
                updatePosition(t: Store<any, any, any>, args: { entity: number; position: { x: number; y: number; z: number } }) {
                    t.update(args.entity, { position: args.position });
                },
            },
        } as const;

        const extendedDatabase = database.extend(extensionSchema) as unknown as typeof database & {
            transactions: typeof database.transactions & {
                createMovingEntity: (args: { position: { x: number; y: number; z: number }; velocity: { x: number; y: number; z: number } }) => number;
                updatePosition: (args: { entity: number; position: { x: number; y: number; z: number } }) => void;
            }
        };

        // Verify original transaction still exists
        const staticEntity = extendedDatabase.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 },
        });

        expect(staticEntity).toBeDefined();
        expect(typeof staticEntity).toBe("number");

        // Verify new transaction exists and works
        const movingEntity = extendedDatabase.transactions.createMovingEntity({
            position: { x: 10, y: 20, z: 30 },
            velocity: { x: 1, y: 2, z: 3 },
        });

        expect(movingEntity).toBeDefined();
        expect(typeof movingEntity).toBe("number");

        const movingEntityData = extendedDatabase.read(movingEntity);
        expect(movingEntityData).toEqual({
            id: movingEntity,
            position: { x: 10, y: 20, z: 30 },
            velocity: { x: 1, y: 2, z: 3 },
        });

        // Verify extended updatePosition transaction works
        extendedDatabase.transactions.updatePosition({
            entity: movingEntity,
            position: { x: 15, y: 25, z: 35 },
        });

        const updatedEntityData = extendedDatabase.read(movingEntity);
        expect(updatedEntityData?.position).toEqual({ x: 15, y: 25, z: 35 });
    });
});

