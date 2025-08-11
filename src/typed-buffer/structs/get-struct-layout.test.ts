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
import { getStructLayout } from "./get-struct-layout.js";
import type { Schema } from "../../schema/schema.js";
import { F32Schema } from "../../schema/f32.js";
import { U32Schema } from "../../schema/u32.js";
import { I32Schema } from "../../schema/i32.js";

describe("getStructLayout", () => {
    it("should handle primitive types", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                a: F32Schema,
                b: U32Schema,
                c: I32Schema,
            }
        };

        const layout = getStructLayout(schema);
        expect(layout.type).toBe("object");
        expect(layout.size).toBe(16);  // rounded to vec4
        expect(layout.fields.a.offset).toBe(0);
        expect(layout.fields.b.offset).toBe(4);
        expect(layout.fields.c.offset).toBe(8);
    });

    it("should handle vec3 with proper padding", () => {
        const schema: Schema = {
            type: "array",
            items: { type: "number", precision: 1 },
            minItems: 3,
            maxItems: 3
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("array");
        expect(layout.size).toBe(12);  // vec3 is 12 bytes, not padded to vec4
        expect(layout.fields["0"].offset).toBe(0);
        expect(layout.fields["1"].offset).toBe(4);
        expect(layout.fields["2"].offset).toBe(8);
    });

    it("should handle nested structs", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                transform: {
                    type: "object",
                    properties: {
                        position: {
                            type: "array",
                            items: F32Schema,
                            minItems: 3,
                            maxItems: 3
                        },
                        scale: F32Schema
                    }
                },
                active: U32Schema
            }
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("object");
        // transform (16 bytes) + active (4 bytes) = 20 bytes
        // rounded up to largest member alignment (16 bytes) = 32 bytes
        expect(layout.size).toBe(32);
        
        const transform = layout.fields.transform.type;
        expect(typeof transform).not.toBe("string");
        if (typeof transform !== "string") {
            // position (vec3 = 12 bytes) + scale (4 bytes) = 16 bytes
            // no padding needed, struct alignment is 16 bytes
            expect(transform.size).toBe(16);
            const position = transform.fields.position.type;
            expect(typeof position !== "string" && position.size).toBe(12);
        }
    });

    it("should handle array of structs", () => {
        const schema: Schema = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    x: { type: "number", precision: 1 },
                    y: { type: "number", precision: 1 }
                }
            },
            minItems: 2,
            maxItems: 2
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("array");
        expect(layout.size).toBe(32);  // 2 structs aligned to vec4
        expect(layout.fields["0"].offset).toBe(0);
        expect(layout.fields["1"].offset).toBe(16);  // aligned to vec4
    });

    it("should demonstrate std140 vec4 + f32 + f32 alignment issue", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                // vec4 (16 bytes, offset 0)
                viewProjection: {
                    type: "array",
                    items: { type: "number", precision: 1 },
                    minItems: 4,
                    maxItems: 4
                },
                // f32 (4 bytes, offset 16)
                lightDirection: {
                    type: "array",
                    items: { type: "number", precision: 1 },
                    minItems: 3,
                    maxItems: 3
                },
                // f32 (4 bytes, offset 32) - CORRECT for std140!
                lightColor: {
                    type: "array",
                    items: { type: "number", precision: 1 },
                    minItems: 3,
                    maxItems: 3
                }
            }
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("object");
        
        // The getStructLayout function is actually working correctly for std140!
        // It's properly padding vec3s to 16-byte boundaries
        expect(layout.fields.lightColor.offset).toBe(32); // This is correct!
        
        // The correct std140 layout is:
        // - viewProjection: offset 0, size 16 bytes
        // - lightDirection: offset 16, size 16 bytes (padded to vec4)
        // - lightColor: offset 32, size 16 bytes (padded to vec4)
        // Total size: 48 bytes
        expect(layout.size).toBe(48); // This is correct
    });

    it("should handle vec3<f32> + f32 struct layout correctly", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                // vec3<f32> (12 bytes, padded to 16 bytes, offset 0)
                position: {
                    type: "array",
                    items: { type: "number", precision: 1 },
                    minItems: 3,
                    maxItems: 3
                },
                // f32 (4 bytes, offset 16)
                scale: { type: "number", precision: 1 }
            }
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("object");
        
        // vec3<f32> should be 16-byte aligned and take 12 bytes
        expect(layout.fields.position.offset).toBe(0);
        const positionType = layout.fields.position.type;
        if (typeof positionType !== "string") {
            expect(positionType.size).toBe(12);
        }
        
        // f32 should follow immediately at offset 12
        expect(layout.fields.scale.offset).toBe(12);
        
        // Total size should be 12 bytes (vec3) + 4 bytes (f32) = 16 bytes
        // no padding needed, struct alignment is 16 bytes
        expect(layout.size).toBe(16);
    });

    // This sample was pulled from here: https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html
    it("should handle complex struct with arrays and nested structs (std140 example)", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                // Main struct fields in expected order
                orientation: {
                    type: "array",
                    items: { type: "number", precision: 1 },
                    minItems: 3,
                    maxItems: 3
                },
                size: { type: "number", precision: 1 },
                direction: {
                    type: "array",
                    items: {
                        type: "array",
                        items: { type: "number", precision: 1 },
                        minItems: 3,
                        maxItems: 3
                    },
                    minItems: 1,
                    maxItems: 1
                },
                scale: { type: "number", precision: 1 },
                // Ex4a struct
                info: {
                    type: "object",
                    properties: {
                        velocity: {
                            type: "array",
                            items: { type: "number", precision: 1 },
                            minItems: 3,
                            maxItems: 3
                        }
                    }
                },
                friction: { type: "number", precision: 1 }
            }
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("object");
        
        // orientation: vec3f at offset 0, size 12 bytes
        expect(layout.fields.orientation.offset).toBe(0);
        const orientationType = layout.fields.orientation.type;
        if (typeof orientationType !== "string") {
            expect(orientationType.size).toBe(12);
        }
        
        // size: f32 at offset 12 (fits right after vec3f)
        expect(layout.fields.size.offset).toBe(12);
        
        // direction: array<vec3f, 1> at offset 16 (aligned to vec4)
        expect(layout.fields.direction.offset).toBe(16);
        const directionType = layout.fields.direction.type;
        if (typeof directionType !== "string") {
            expect(directionType.size).toBe(16); // vec3f padded to vec4
        }
        
        // scale: f32 at offset 32 (after array)
        expect(layout.fields.scale.offset).toBe(32);
        
        // info: Ex4a struct at offset 48 (aligned to vec4)
        expect(layout.fields.info.offset).toBe(48);
        const infoType = layout.fields.info.type;
        if (typeof infoType !== "string") {
            expect(infoType.size).toBe(16); // vec3f padded to vec4
        }
        
        // friction: f32 at offset 64 (after struct)
        expect(layout.fields.friction.offset).toBe(64);
        
        // Total size should be 68 bytes, rounded up to vec4 = 80 bytes
        expect(layout.size).toBe(80);
    });

    it("should reject invalid schemas", () => {
        // Non-fixed length array
        expect(() => getStructLayout({
            type: "array",
            items: { type: "number", precision: 1 }
        })).toThrow();

        // Invalid primitive type
        expect(() => getStructLayout({
            type: "object",
            properties: {
                a: { type: "string" }
            }
        })).toThrow();

        // Array length < 1
        expect(() => getStructLayout({
            type: "array",
            items: { type: "number", precision: 1 },
            minItems: 0,
            maxItems: 0
        })).toThrow();
    });

}); 