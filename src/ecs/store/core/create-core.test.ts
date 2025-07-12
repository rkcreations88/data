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
import { createCore } from "./create-core.js";
import { Schema } from "../../../schema/schema.js";
import type { Entity } from "../../entity.js";
import { F32Schema } from "../../../schema/f32.js";

// Shared test schemas
export const positionSchema = {
    type: "object",
    properties: {
        x: F32Schema,
        y: F32Schema,
        z: F32Schema,
    }
} as const satisfies Schema;

export const healthSchema = {
    type: "object",
    properties: {
        current: F32Schema,
        max: F32Schema,
    }
} as const satisfies Schema;

export const nameSchema = {
    type: "string",
    maxLength: 50,
} as const satisfies Schema;

// Reusable test suite for any core-like interface
export function createCoreTestSuite(
    name: string,
    factory: typeof createCore = createCore
) {
    describe(name, () => {
        it("should create with basic components", () => {
            const core = factory({
                position: positionSchema,
                health: healthSchema,
            });

            expect(core).toBeDefined();
            expect(core.componentSchemas).toHaveProperty("id");
            expect(core.componentSchemas).toHaveProperty("position");
            expect(core.componentSchemas).toHaveProperty("health");
            expect(core.componentSchemas.id).toBeDefined();
            expect(core.componentSchemas.position).toBeDefined();
            expect(core.componentSchemas.health).toBeDefined();
        });

        it("should query archetypes correctly", () => {
            const core = factory({
                position: positionSchema,
                health: healthSchema,
            });

            // Create entities with different component combinations
            const archetype1 = core.ensureArchetype(["id", "position"]);
            const entity1 = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });

            const archetype2 = core.ensureArchetype(["id", "health"]);
            const entity2 = archetype2.insert({ health: { current: 100, max: 100 } });

            const archetype3 = core.ensureArchetype(["id", "position", "health"]);
            const entity3 = archetype3.insert({
                position: { x: 0, y: 0, z: 0 },
                health: { current: 50, max: 100 }
            });

            // Query for position component
            const positionArchetypes = core.queryArchetypes(["position"]);
            expect(positionArchetypes).toHaveLength(2);
            expect(positionArchetypes.some(a => a.components.has("position"))).toBe(true);
            expect(positionArchetypes.some(a => a.components.has("health"))).toBe(true);

            // Query for health component
            const healthArchetypes = core.queryArchetypes(["health"]);
            expect(healthArchetypes).toHaveLength(2);
            expect(healthArchetypes.some(a => a.components.has("position"))).toBe(true);
            expect(healthArchetypes.some(a => a.components.has("health"))).toBe(true);

            // Query for both components
            const bothArchetypes = core.queryArchetypes(["position", "health"]);
            expect(bothArchetypes).toHaveLength(1);
            expect(bothArchetypes[0].components.has("position")).toBe(true);
            expect(bothArchetypes[0].components.has("health")).toBe(true);
        });

        it("should query archetypes with exclude option", () => {
            const core = factory({
                position: positionSchema,
                health: healthSchema,
            });

            // Create entities with different component combinations
            const archetype1 = core.ensureArchetype(["id", "position"]);
            const entity1 = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });

            const archetype2 = core.ensureArchetype(["id", "health"]);
            const entity2 = archetype2.insert({ health: { current: 100, max: 100 } });

            const archetype3 = core.ensureArchetype(["id", "position", "health"]);
            const entity3 = archetype3.insert({
                position: { x: 0, y: 0, z: 0 },
                health: { current: 50, max: 100 }
            });

            // Query for position but exclude health
            const positionOnlyArchetypes = core.queryArchetypes(["position"], { exclude: ["health"] });
            expect(positionOnlyArchetypes).toHaveLength(1);
            expect(positionOnlyArchetypes[0].components.has("position")).toBe(true);
            expect((positionOnlyArchetypes[0].components as Set<string>).has("health")).toBe(false);
        });

        it("should ensure archetype creates new archetype when needed", () => {
            const core = factory({
                position: positionSchema,
                health: healthSchema,
            });

            // First call should create new archetype
            const archetype1 = core.ensureArchetype(["id", "position"]);
            expect(archetype1).toBeDefined();
            expect(archetype1.components.has("id")).toBe(true);
            expect(archetype1.components.has("position")).toBe(true);
            expect((archetype1.components as Set<string>).has("health")).toBe(false);

            // Second call with same components should return same archetype
            const archetype2 = core.ensureArchetype(["id", "position"]);
            expect(archetype2).toBe(archetype1);

            // Different components should create new archetype
            const archetype3 = core.ensureArchetype(["id", "health"]);
            expect(archetype3).not.toBe(archetype1);
            expect(archetype3.components.has("id")).toBe(true);
            expect(archetype3.components.has("health")).toBe(true);
            expect(archetype3.components.has("position")).toBe(false);
        });

        it("should throw error when ensuring archetype without id", () => {
            const core = factory({
                position: positionSchema,
            });

            expect(() => {
                core.ensureArchetype(["position"]);
            }).toThrow("id is required");
        });

        it("should locate entities correctly", () => {
            const core = factory({
                position: positionSchema,
            });

            const archetype = core.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            const location = core.locate(entity);
            expect(location).not.toBeNull();
            expect(location?.archetype.id).toBe(archetype.id);
            expect(location?.row).toBeGreaterThanOrEqual(0);
        });

        it("should return null when locating non-existent entity", () => {
            const core = factory({
                position: positionSchema,
            });

            const location = core.locate(999 as Entity);
            expect(location).toBeNull();
        });

        it("should read entity data correctly", () => {
            const core = factory({
                position: positionSchema,
            });

            const archetype = core.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            const data = core.read(entity);
            expect(data).not.toBeNull();
            expect(data?.id).toBe(entity);
            expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
        });

        it("should return null when reading non-existent entity", () => {
            const core = factory({
                position: positionSchema,
            });

            const data = core.read(999 as Entity);
            expect(data).toBeNull();
        });

        it("should return null when reading entity with invalid id -1", () => {
            const core = factory({
                position: positionSchema,
            });

            const data = core.read(-1);
            expect(data).toBeNull();
        });

        it("should delete entities correctly", () => {
            const core = factory({
                position: positionSchema,
            });

            const archetype = core.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            // Verify entity exists
            expect(core.locate(entity)).not.toBeNull();
            expect(core.read(entity)).not.toBeNull();

            // Delete entity
            core.delete(entity);

            // Verify entity is deleted
            expect(core.locate(entity)).toBeNull();
            expect(core.read(entity)).toBeNull();
        });

        it("should handle deleting non-existent entity gracefully", () => {
            const core = factory({
                position: positionSchema,
            });

            expect(() => {
                core.delete(999 as Entity);
            }).not.toThrow();
        });

        it("should update entity within same archetype", () => {
            const core = factory({
                position: positionSchema,
            });

            const archetype = core.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            // Update position
            core.update(entity, { position: { x: 10, y: 20, z: 30 } });

            // Verify update
            const data = core.read(entity);
            expect(data?.position).toEqual({ x: 10, y: 20, z: 30 });
        });

        it("should move entity to new archetype when adding components", () => {
            const core = factory({
                position: positionSchema,
                health: healthSchema,
            });

            const archetype1 = core.ensureArchetype(["id", "position"]);
            const entity = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });

            // Add health component
            core.update(entity, { health: { current: 100, max: 100 } });

            // Verify entity moved to new archetype
            const location = core.locate(entity);
            expect(location).not.toBeNull();
            expect(location?.archetype).not.toBe(archetype1.id);

            const data = core.read(entity);
            expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
            expect(data?.health).toEqual({ current: 100, max: 100 });
        });

        it("should move entity to new archetype when removing components", () => {
            const core = factory({
                position: positionSchema,
                health: healthSchema,
            });

            const archetype1 = core.ensureArchetype(["id", "position", "health"]);
            const entity = archetype1.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            // Remove health component
            core.update(entity, { health: undefined });

            // Verify entity moved to new archetype
            const location = core.locate(entity);
            expect(location).not.toBeNull();
            expect(location?.archetype).not.toBe(archetype1.id);

            const data = core.read(entity);
            expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
            expect(data?.health).toBeUndefined();
        });

        it("should throw error when updating non-existent entity", () => {
            const core = factory({
                position: positionSchema,
            });

            expect(() => {
                core.update(999 as Entity, { position: { x: 1, y: 2, z: 3 } });
            }).toThrow("Entity not found");
        });

        it("should handle complex component updates", () => {
            const core = factory({
                position: positionSchema,
                health: healthSchema,
            });

            const archetype = core.ensureArchetype(["id", "position", "health"]);
            const entity = archetype.insert({
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            // Update both components
            core.update(entity, {
                position: { x: 10, y: 20, z: 30 },
                health: { current: 50, max: 100 }
            });

            const data = core.read(entity);
            expect(data?.position).toEqual({ x: 10, y: 20, z: 30 });
            expect(data?.health).toEqual({ current: 50, max: 100 });
        });

        it("should handle mixed add/remove operations", () => {
            const core = factory({
                position: positionSchema,
                health: healthSchema,
            });

            const archetype1 = core.ensureArchetype(["id", "position"]);
            const entity = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });

            // Add health and update position
            core.update(entity, {
                position: { x: 10, y: 20, z: 30 },
                health: { current: 100, max: 100 }
            });

            const data = core.read(entity);
            expect(data?.position).toEqual({ x: 10, y: 20, z: 30 });
            expect(data?.health).toEqual({ current: 100, max: 100 });
        });

        it("should maintain entity count correctly", () => {
            const core = factory({
                position: positionSchema,
            });

            const archetype = core.ensureArchetype(["id", "position"]);
            const entity1 = archetype.insert({ position: { x: 1, y: 2, z: 3 } });
            const entity2 = archetype.insert({ position: { x: 4, y: 5, z: 6 } });

            // Verify both entities exist
            expect(core.locate(entity1)).not.toBeNull();
            expect(core.locate(entity2)).not.toBeNull();

            // Delete one entity
            core.delete(entity1);

            // Verify only one entity remains
            expect(core.locate(entity1)).toBeNull();
            expect(core.locate(entity2)).not.toBeNull();
        });

        it("should handle empty component updates", () => {
            const core = factory({
                position: positionSchema,
            });

            const archetype = core.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            // Update with empty object
            core.update(entity, {});

            // Verify entity still exists with original data
            const data = core.read(entity);
            expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
        });

        it("should handle large number of entities", () => {
            const core = factory({
                position: positionSchema,
            });

            const archetype = core.ensureArchetype(["id", "position"]);
            const entities: Entity[] = [];

            // Create many entities
            for (let i = 0; i < 100; i++) {
                const entity = archetype.insert({ position: { x: i, y: i, z: i } });
                entities.push(entity);
            }

            // Verify all entities exist
            for (const entity of entities) {
                expect(core.locate(entity)).not.toBeNull();
            }

            // Delete some entities
            for (let i = 0; i < 50; i++) {
                core.delete(entities[i]);
            }

            // Verify remaining entities exist
            for (let i = 50; i < 100; i++) {
                expect(core.locate(entities[i])).not.toBeNull();
            }

            // Verify deleted entities don't exist
            for (let i = 0; i < 50; i++) {
                expect(core.locate(entities[i])).toBeNull();
            }
        });

        describe("core read with minArchetype", () => {
            it("should read entity data when entity has matching components", () => {
                const core = factory({
                    position: positionSchema,
                    health: healthSchema,
                });

                const positionArchetype = core.ensureArchetype(["id", "position"]);
                const entity = positionArchetype.insert({ position: { x: 1, y: 2, z: 3 } });

                const data = core.read(entity, positionArchetype);
                expect(data).not.toBeNull();
                expect((data as any)?.id).toBe(entity);
                expect((data as any)?.position).toEqual({ x: 1, y: 2, z: 3 });
            });

            it("should return null when entity doesn't exist", () => {
                const core = factory({
                    position: positionSchema,
                });

                const archetype = core.ensureArchetype(["id", "position"]);
                const data = core.read(999 as Entity, archetype);
                expect(data).toBeNull();
            });

            it("should return null when entity exists but doesn't have required components", () => {
                const core = factory({
                    position: positionSchema,
                    health: healthSchema,
                });

                // Create entity with only position
                const positionArchetype = core.ensureArchetype(["id", "position"]);
                const entity = positionArchetype.insert({ position: { x: 1, y: 2, z: 3 } });

                // Try to read from health archetype
                const healthArchetype = core.ensureArchetype(["id", "health"]);
                const data = core.read(entity, healthArchetype);
                expect(data).toBeNull();
            });

            it("should read entity data when entity has more components than archetype requires", () => {
                const core = factory({
                    position: positionSchema,
                    health: healthSchema,
                });

                // Create entity with both position and health
                const fullArchetype = core.ensureArchetype(["id", "position", "health"]);
                const entity = fullArchetype.insert({
                    position: { x: 1, y: 2, z: 3 },
                    health: { current: 100, max: 100 }
                });

                // Should be able to read from position-only archetype
                const positionArchetype = core.ensureArchetype(["id", "position"]);
                const data = core.read(entity, positionArchetype);
                expect(data).not.toBeNull();
                expect((data as any)?.id).toBe(entity);
                expect((data as any)?.position).toEqual({ x: 1, y: 2, z: 3 });
            });

            it("should return null when entity has different components than archetype", () => {
                const core = factory({
                    position: positionSchema,
                    health: healthSchema,
                    name: nameSchema,
                });

                // Create entity with position and health
                const positionHealthArchetype = core.ensureArchetype(["id", "position", "health"]);
                const entity = positionHealthArchetype.insert({
                    position: { x: 1, y: 2, z: 3 },
                    health: { current: 100, max: 100 }
                });

                // Try to read from name archetype
                const nameArchetype = core.ensureArchetype(["id", "name"]);
                const data = core.read(entity, nameArchetype);
                expect(data).toBeNull();
            });

            it("should read entity data after component updates", () => {
                const core = factory({
                    position: positionSchema,
                    health: healthSchema,
                });

                const positionArchetype = core.ensureArchetype(["id", "position"]);
                const entity = positionArchetype.insert({ position: { x: 1, y: 2, z: 3 } });

                // Update position
                core.update(entity, { position: { x: 10, y: 20, z: 30 } });

                const data = core.read(entity, positionArchetype);
                expect(data).not.toBeNull();
                expect((data as any)?.position).toEqual({ x: 10, y: 20, z: 30 });
            });

            it("should return null after entity is deleted", () => {
                const core = factory({
                    position: positionSchema,
                });

                const archetype = core.ensureArchetype(["id", "position"]);
                const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

                // Verify entity exists
                expect(core.read(entity, archetype)).not.toBeNull();

                // Delete entity
                core.delete(entity);

                // Verify entity is no longer readable
                expect(core.read(entity, archetype)).toBeNull();
            });

            it("should handle multiple entities in same archetype", () => {
                const core = factory({
                    position: positionSchema,
                });

                const archetype = core.ensureArchetype(["id", "position"]);
                const entity1 = archetype.insert({ position: { x: 1, y: 2, z: 3 } });
                const entity2 = archetype.insert({ position: { x: 4, y: 5, z: 6 } });

                const data1 = core.read(entity1, archetype);
                const data2 = core.read(entity2, archetype);

                expect(data1).not.toBeNull();
                expect(data2).not.toBeNull();
                expect((data1 as any)?.position).toEqual({ x: 1, y: 2, z: 3 });
                expect((data2 as any)?.position).toEqual({ x: 4, y: 5, z: 6 });
            });

            it("should return null for invalid entity ID -1", () => {
                const core = factory({
                    position: positionSchema,
                });

                const archetype = core.ensureArchetype(["id", "position"]);
                const data = core.read(-1, archetype);
                expect(data).toBeNull();
            });
        });
    });
}

// Original core-specific tests
describe("createCore", () => {
    createCoreTestSuite("Core functionality");
}); 