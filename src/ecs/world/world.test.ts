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
import { World } from "./world.js";

describe("World.Schema.create", () => {
    describe("partial schema creation", () => {
        it("should create a schema with all properties defaulting to empty objects when given empty schema", () => {
            const schema = World.Schema.create({});

            expect(schema.components).toEqual({});
            expect(schema.resources).toEqual({});
            expect(schema.archetypes).toEqual({});
            expect(schema.transactions).toEqual({});
            expect(schema.systems).toEqual({});
        });

        it("should create a schema with components and default empty objects for other properties when given only components", () => {
            const schema = World.Schema.create({
                components: {
                    position: { type: "number" },
                    velocity: { type: "number" }
                }
            });

            expect(schema.components).toHaveProperty("position");
            expect(schema.components).toHaveProperty("velocity");
            expect(Object.keys(schema.resources)).toHaveLength(0);
            expect(Object.keys(schema.archetypes)).toHaveLength(0);
            expect(Object.keys(schema.transactions)).toHaveLength(0);
            expect(Object.keys(schema.systems)).toHaveLength(0);
        });

        it("should create a schema with systems and default empty objects for other properties when given only systems", () => {
            const testSystem = () => () => { };
            const schema = World.Schema.create({
                systems: {
                    renderSystem: {
                        create: testSystem
                    }
                }
            });

            expect(schema.systems).toHaveProperty("renderSystem");
            expect(schema.systems.renderSystem?.create).toBe(testSystem);
            expect(Object.keys(schema.components)).toHaveLength(0);
            expect(Object.keys(schema.resources)).toHaveLength(0);
            expect(Object.keys(schema.archetypes)).toHaveLength(0);
            expect(Object.keys(schema.transactions)).toHaveLength(0);
        });

        it("should create a schema with specified properties and defaults for omitted ones when given multiple partial properties", () => {
            const schema = World.Schema.create({
                components: {
                    health: { type: "number" }
                },
                resources: {
                    time: { default: 0 }
                },
                systems: {
                    updateSystem: {
                        create: (world) => () => { }
                    }
                }
            });

            expect(schema.components).toHaveProperty("health");
            expect(schema.resources).toHaveProperty("time");
            expect(schema.systems).toHaveProperty("updateSystem");
            expect(Object.keys(schema.archetypes)).toHaveLength(0);
            expect(Object.keys(schema.transactions)).toHaveLength(0);
        });
    });

    describe("schema merging with dependencies", () => {
        it("should merge both schemas with all properties preserved when given partial schema with dependencies", () => {
            const baseSchema = World.Schema.create({
                components: {
                    position: { type: "number" }
                },
                resources: {
                    time: { default: 0 }
                }
            });

            const extendedSchema = World.Schema.create({
                components: {
                    velocity: { type: "number" }
                }
            }, [baseSchema]);

            expect(extendedSchema.components).toHaveProperty("position");
            expect(extendedSchema.components).toHaveProperty("velocity");
            expect(extendedSchema.resources).toHaveProperty("time");
            expect(Object.keys(extendedSchema.components)).toHaveLength(2);
            expect(Object.keys(extendedSchema.resources)).toHaveLength(1);
        });

        it("should create a schema containing only the dependency properties when given empty schema with dependencies", () => {
            const baseSchema = World.Schema.create({
                components: {
                    transform: { type: "number" }
                },
                systems: {
                    baseSystem: {
                        create: (world) => () => { }
                    }
                }
            });

            const emptyExtension = World.Schema.create({}, [baseSchema]);

            expect(emptyExtension.components).toHaveProperty("transform");
            expect(emptyExtension.systems).toHaveProperty("baseSystem");
            expect(Object.keys(emptyExtension.components)).toHaveLength(1);
            expect(Object.keys(emptyExtension.systems)).toHaveLength(1);
        });

        it("should merge all schemas together with properties from all dependencies when given multiple dependencies", () => {
            const schemaA = World.Schema.create({
                components: { a: { type: "number" } }
            });

            const schemaB = World.Schema.create({
                components: { b: { type: "number" } }
            });

            const schemaC = World.Schema.create({
                components: { c: { type: "number" } }
            });

            const merged = World.Schema.create({
                components: { d: { type: "number" } }
            }, [schemaA, schemaB, schemaC]);

            expect(merged.components).toHaveProperty("a");
            expect(merged.components).toHaveProperty("b");
            expect(merged.components).toHaveProperty("c");
            expect(merged.components).toHaveProperty("d");
            expect(Object.keys(merged.components)).toHaveLength(4);
        });
    });

    describe("edge cases", () => {
        it("should create a valid schema with empty systems object when S = never (no systems type)", () => {
            const schema = World.Schema.create({
                components: {
                    test: { type: "number" }
                }
            });

            expect(typeof schema.systems).toBe("object");
            expect(schema.systems).not.toBeNull();
            expect(Object.keys(schema.systems)).toHaveLength(0);
            expect(schema.components).toHaveProperty("test");
        });

        it("should merge schemas with dependencies taking precedence for overlapping properties", () => {
            const baseSchema = World.Schema.create({
                components: {
                    position: { type: "number" },
                    velocity: { type: "number" }
                }
            });

            const extendedSchema = World.Schema.create({
                components: {
                    position: { type: "number" },
                    mass: { type: "number" }
                }
            }, [baseSchema]);

            // All components should be present
            expect(extendedSchema.components).toHaveProperty("position");
            expect(extendedSchema.components).toHaveProperty("velocity");
            expect(extendedSchema.components).toHaveProperty("mass");
            expect(Object.keys(extendedSchema.components)).toHaveLength(3);
        });
    });
});

