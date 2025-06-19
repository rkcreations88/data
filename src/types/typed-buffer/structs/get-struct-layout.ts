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
import { memoizeFactory } from "../../../core/functions/memoize-factory.js";
import { I32Schema } from "../../../schema/i32.js";
import { type Schema } from "../../../schema/schema.js";
import { U32Schema } from "../../../schema/u32.js";
import type { StructFieldPrimitiveType, StructLayout } from "./struct-layout.js";

// Constants for std140 layout
const VEC4_SIZE = 16;  // size in bytes

/**
 * Gets alignment in bytes for a field within a struct
 * Adheres to WebGPU std140 layout rules
 */
const getStructFieldAlignment = (type: StructFieldPrimitiveType | StructLayout): number => {
    // Primitive types are 4-byte aligned
    if (typeof type === "string") {
        return 4;
    }
    // Arrays are aligned to vec4 (16 bytes)
    if (type.type === "array") {
        return VEC4_SIZE;
    }
    // Structs are aligned to 4 bytes within other structs
    return 4;
};

/**
 * Gets size in bytes for a field type
 */
const getFieldSize = (type: StructFieldPrimitiveType | StructLayout): number => {
    if (typeof type === "string") {
        return 4;  // All primitives are 4 bytes
    }
    return type.size;
};

/**
 * Gets stride in bytes for an array element type
 * In std140, array elements are aligned to vec4 if they are arrays/structs
 * but primitives just use their natural alignment
 */
const getArrayElementStride = (type: StructFieldPrimitiveType | StructLayout): number => {
    // For primitives in arrays, use 4 bytes
    if (typeof type === "string") {
        return 4;
    }
    // For structs and arrays, round up to vec4
    return roundUpToAlignment(type.size, VEC4_SIZE);
};

/**
 * Gets alignment for array elements
 * In std140, array elements are aligned to vec4 if they are arrays/structs
 * but primitives just use their natural alignment
 */
const getArrayElementAlignment = (type: StructFieldPrimitiveType | StructLayout): number => {
    if (typeof type === "string") {
        return 4;  // Primitives use natural alignment
    }
    return VEC4_SIZE;  // Arrays and structs align to vec4
};

/**
 * Rounds up to the next multiple of alignment
 */
const roundUpToAlignment = (offset: number, alignment: number): number => {
    return Math.ceil(offset / alignment) * alignment;
};

/**
 * Converts a primitive schema type to a StructFieldPrimitiveType or returns null if not a valid primitive type
 */
const getPrimitiveType = (schema: Schema): StructFieldPrimitiveType | null => {
    if (schema.type === "number" || schema.type === "integer") {
        if (schema.type === "integer") {
            if (schema.minimum !== undefined && schema.minimum >= 0 && schema.maximum && schema.maximum <= U32Schema.maximum) {
                return "u32";
            }
            if (schema.minimum !== undefined && schema.minimum < 0 && schema.maximum && schema.maximum <= I32Schema.maximum) {
                return "i32";
            }
        }
        else if (schema.precision === 1 || schema.precision === 2) {
            return "f32";
        }
    }

    return null;
};

/**
 * Analyzes a Schema and returns a StructLayout.
 * Returns null if schema is not a valid struct schema.
 */
const getStructLayoutInternal = memoizeFactory((schema: Schema): StructLayout | null => {
    // Handle root array/tuple case
    if (schema.type === "array") {
        if (!schema.items || Array.isArray(schema.items)) {
            throw new Error("Array schema must have single item type");
        }
        if (schema.minItems !== schema.maxItems || !schema.minItems) {
            throw new Error("Array must have fixed length");
        }
        if (schema.minItems < 2) {
            throw new Error("Array length must be at least 2");
        }

        // Special case for vec3
        const primitiveType = getPrimitiveType(schema.items);
        if (primitiveType && schema.minItems === 3) {
            const fields: StructLayout["fields"] = {};
            for (let i = 0; i < 3; i++) {
                fields[i.toString()] = {
                    offset: i * 4,
                    type: primitiveType
                };
            }
            return {
                type: "array",
                size: VEC4_SIZE,  // vec3 is padded to vec4
                fields
            };
        }

        // Regular array case
        const fields: StructLayout["fields"] = {};
        const elementType = primitiveType ?? getStructLayoutInternal(schema.items);
        if (!elementType) {
            return null;
        }
        let currentOffset = 0;

        // Arrays are aligned to vec4 boundary
        currentOffset = roundUpToAlignment(currentOffset, VEC4_SIZE);
        const elementAlignment = getArrayElementAlignment(elementType);
        const stride = getArrayElementStride(elementType);

        for (let i = 0; i < schema.minItems; i++) {
            // Align each element according to its type
            currentOffset = roundUpToAlignment(currentOffset, elementAlignment);
            fields[i.toString()] = {
                offset: currentOffset,
                type: elementType
            };
            currentOffset += stride;
        }

        // Total size must be rounded up to vec4
        const size = roundUpToAlignment(currentOffset, VEC4_SIZE);
        return {
            type: "array",
            size,
            fields
        };
    }

    // Handle object case
    if (schema.type !== "object" || !schema.properties) {
        return null;
    }

    const fields: StructLayout["fields"] = {};
    let currentOffset = 0;

    // First pass: create all fields and calculate alignments
    for (const [name, fieldSchema] of Object.entries(schema.properties)) {
        const primitiveType = getPrimitiveType(fieldSchema);
        const fieldType = primitiveType ?? getStructLayoutInternal(fieldSchema);
        if (!fieldType) {
            return null;
        }
        const alignment = getStructFieldAlignment(fieldType);

        // Align field to its required alignment
        currentOffset = roundUpToAlignment(currentOffset, alignment);
        fields[name] = {
            offset: currentOffset,
            type: fieldType
        };
        currentOffset += getFieldSize(fieldType);
    }

    // Round up total size to vec4
    const size = roundUpToAlignment(currentOffset, VEC4_SIZE);
    return {
        type: "object",
        size,
        fields
    };
});

export function getStructLayout(schema: Schema): StructLayout
export function getStructLayout(schema: Schema, throwError: true): StructLayout
export function getStructLayout(schema: Schema, throwError: boolean): StructLayout | null
export function getStructLayout(schema: Schema, throwError = true): StructLayout | null {
    const layout = getStructLayoutInternal(schema);
    if (layout === null && throwError) {
        throw new Error("Invalid structure schema");
    }
    return layout;
}