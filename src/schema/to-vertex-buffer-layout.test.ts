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
import { schemaToVertexBufferLayout, schemaToVertexBufferLayoutForType } from "./to-vertex-buffer-layout.js";
import type { Schema } from "./schema.js";

describe("schemaToVertexBufferLayout", () => {
    describe("position-color-normal vertex schema", () => {
        const positionColorNormalSchema: Schema = {
            type: "object",
            properties: {
                position: {
                    type: "array",
                    items: { type: "number", precision: 1 },
                    minItems: 3,
                    maxItems: 3
                },
                color: {
                    type: "array", 
                    items: { type: "number", precision: 1 },
                    minItems: 4,
                    maxItems: 4
                },
                normal: {
                    type: "array",
                    items: { type: "number", precision: 1 },
                    minItems: 3,
                    maxItems: 3
                }
            },
            layout: "packed"
        };

        it("should generate correct packed layout for position-color-normal", () => {
            const layout = schemaToVertexBufferLayout(positionColorNormalSchema);

            expect(layout.arrayStride).toBe(40); // 3 + 4 + 3 = 10 floats × 4 bytes = 40 bytes
            expect(layout.stepMode).toBe("vertex");
            expect(layout.attributes).toHaveLength(3);

            // Position: Vec3 at offset 0
            expect(layout.attributes[0]).toEqual({
                format: "float32x3",
                offset: 0,
                shaderLocation: 0
            });

            // Color: Vec4 at offset 12
            expect(layout.attributes[1]).toEqual({
                format: "float32x4", 
                offset: 12,
                shaderLocation: 1
            });

            // Normal: Vec3 at offset 28
            expect(layout.attributes[2]).toEqual({
                format: "float32x3",
                offset: 28,
                shaderLocation: 2
            });
        });

        it("should allow custom shader locations", () => {
            const layout = schemaToVertexBufferLayout(positionColorNormalSchema, {
                shaderLocations: {
                    position: 0,
                    color: 8,
                    normal: 9
                }
            });

            expect(layout.attributes.find(a => a.shaderLocation === 0)?.offset).toBe(0);
            expect(layout.attributes.find(a => a.shaderLocation === 8)?.offset).toBe(12); 
            expect(layout.attributes.find(a => a.shaderLocation === 9)?.offset).toBe(28);
        });

        it("should support instance step mode", () => {
            const layout = schemaToVertexBufferLayout(positionColorNormalSchema, {
                stepMode: "instance"
            });

            expect(layout.stepMode).toBe("instance");
        });
    });

    describe("simple position schema", () => {
        const positionSchema: Schema = {
            type: "object",
            properties: {
                position: {
                    type: "array",
                    items: { type: "number", precision: 1 },
                    minItems: 3,
                    maxItems: 3
                }
            },
            layout: "packed"
        };

        it("should generate minimal vertex layout", () => {
            const layout = schemaToVertexBufferLayout(positionSchema);

            expect(layout.arrayStride).toBe(12); // Vec3 = 12 bytes
            expect(layout.attributes).toHaveLength(1);
            expect(layout.attributes[0]).toEqual({
                format: "float32x3",
                offset: 0,
                shaderLocation: 0
            });
        });
    });

    describe("primitive type schemas", () => {
        it("should handle single float", () => {
            const schema: Schema = {
                type: "object",
                properties: {
                    weight: { type: "number", precision: 1 }
                },
                layout: "packed"
            };

            const layout = schemaToVertexBufferLayout(schema);

            expect(layout.arrayStride).toBe(4);
            expect(layout.attributes[0]).toEqual({
                format: "float32",
                offset: 0,
                shaderLocation: 0
            });
        });

        it("should handle integer types", () => {
            const schema: Schema = {
                type: "object",
                properties: {
                    id: { type: "integer", minimum: 0, maximum: 65535 }
                },
                layout: "packed"
            };

            const layout = schemaToVertexBufferLayout(schema);

            expect(layout.arrayStride).toBe(4);
            expect(layout.attributes[0]).toEqual({
                format: "uint32",
                offset: 0,
                shaderLocation: 0
            });
        });
    });

    describe("error handling", () => {
        it("should throw error for non-struct schemas", () => {
            const arraySchema: Schema = {
                type: "array",
                items: { type: "number" }
            };

            expect(() => {
                schemaToVertexBufferLayout(arraySchema);
            }).toThrow(/Array must have fixed length/);
        });

        it("should throw error for unsupported field types", () => {
            const schema: Schema = {
                type: "object",
                properties: {
                    name: { type: "string" }
                },
                layout: "packed"
            };

            expect(() => {
                schemaToVertexBufferLayout(schema);
            }).toThrow(/not a valid struct type/);
        });

        it("should throw error for oversized vectors", () => {
            const schema: Schema = {
                type: "object",
                properties: {
                    values: {
                        type: "array",
                        items: { type: "number", precision: 1 },
                        minItems: 5,
                        maxItems: 5
                    }
                },
                layout: "packed"
            };

            expect(() => {
                schemaToVertexBufferLayout(schema);
            }).toThrow(/dimensions must be 1-4 elements/);
        });
    });

    describe("layout mode handling", () => {
        it("should use schema layout by default", () => {
            const schema: Schema = {
                type: "object",
                properties: {
                    position: {
                        type: "array",
                        items: { type: "number", precision: 1 },
                        minItems: 3,
                        maxItems: 3
                    }
                },
                layout: "packed"
            };

            const layout = schemaToVertexBufferLayout(schema);
            expect(layout.arrayStride).toBe(12); // Packed: tight packing
        });

        it("should override schema layout when specified", () => {
            const schema: Schema = {
                type: "object",
                properties: {
                    position: {
                        type: "array",
                        items: { type: "number", precision: 1 },
                        minItems: 3,
                        maxItems: 3
                    }
                },
                layout: "packed"
            };

            const layout = schemaToVertexBufferLayout(schema, {
                layout: "std140"
            });
            expect(layout.arrayStride).toBe(16); // std140: 16-byte alignment
        });
    });

    describe("type-safe helper", () => {
        it("should work with schemaToVertexBufferLayoutForType", () => {
            const testSchema: Schema = {
                type: "object",
                properties: {
                    position: {
                        type: "array",
                        items: { type: "number", precision: 1 },
                        minItems: 2,
                        maxItems: 2
                    }
                },
                layout: "packed"
            };

            const layout = schemaToVertexBufferLayoutForType(testSchema);
            expect(layout.arrayStride).toBe(8); // Vec2 = 8 bytes
            expect(layout.attributes[0].format).toBe("float32x2");
        });
    });
});
