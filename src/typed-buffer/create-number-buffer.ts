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
import { grow } from "../internal/array-buffer-like/grow.js";
import { I32Schema } from "../schema/i32.js";
import { Schema } from "../schema/schema.js";
import { TypedArrayConstructor } from "../internal/typed-array/index.js";
import { U32Schema } from "../schema/u32.js";
import { TypedBuffer } from "./typed-buffer.js";

const getTypedArrayConstructor = (schema: Schema): TypedArrayConstructor => {
    if (schema.type === 'number' || schema.type === 'integer') {
        if (schema.type === "integer") {
            if (schema.minimum !== undefined && schema.maximum !== undefined) {
                if (schema.minimum >= U32Schema.minimum && schema.maximum <= U32Schema.maximum) {
                    return Uint32Array;
                }
                if (schema.minimum >= I32Schema.minimum && schema.maximum <= I32Schema.maximum) {
                    return Int32Array;
                }
            }
        }
        else if (schema.precision === 1) {
            return Float32Array;
        }
        return Float64Array;
    }
    throw new Error("Schema is not a valid number schema");
}

export const createNumberBuffer = (args: {
    schema: Schema,
    length?: number,
    maxLength?: number,
    arrayBuffer?: ArrayBufferLike,
}): TypedBuffer<number> => {
    const {
        schema,
        length = 16,
        maxLength = length,
    } = args;
    const typedArrayConstructor = getTypedArrayConstructor(schema);
    const stride = typedArrayConstructor.BYTES_PER_ELEMENT;
    const {
        arrayBuffer = new ArrayBuffer(stride * length, { maxByteLength: stride * maxLength }),
    } = args;
    const array = new typedArrayConstructor(arrayBuffer);
    const typedBuffer = {
        getTypedArray() {
            return array;
        },
        get size(): number {
            return array.length;
        },
        set size(value: number) {
            grow(arrayBuffer, value * stride);
        },
        get(index: number): number {
            return array[index];
        },
        set(index: number, value: number): void {
            array[index] = value;
        },
        copyWithin(target: number, start: number, end: number): void {
            array.copyWithin(target, start, end);
        },
        [Symbol.iterator](): IterableIterator<number> {
            return array[Symbol.iterator]();
        },
    } as const satisfies TypedBuffer<number>;
    return typedBuffer;
}