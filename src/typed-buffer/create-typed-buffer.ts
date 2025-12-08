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
import { FromSchema, Schema } from "../schema/index.js";
import { createStructBuffer } from "./create-struct-buffer.js";
import { getStructLayout } from "./structs/get-struct-layout.js";
import { TypedBuffer } from "./typed-buffer.js";
import { createNumberBuffer } from "./create-number-buffer.js";
import { createArrayBuffer } from "./create-array-buffer.js";
import { createConstBuffer } from "./create-const-buffer.js";

export function createTypedBuffer <S extends Schema>(
    schema: S,
    initialCapacity?: number,
): TypedBuffer<FromSchema<S>>
export function createTypedBuffer <S extends Schema>(
    schema: S,
    initialValues: FromSchema<S>[]
): TypedBuffer<FromSchema<S>>
export function createTypedBuffer <S extends Schema>(
    schema: S,
    initialCapacityOrValues?: number | FromSchema<S>[],
): TypedBuffer<FromSchema<S>> {
    if (Array.isArray(initialCapacityOrValues)) {
        const buffer = createTypedBufferInternal<S>(schema, initialCapacityOrValues.length);
        for (let i = 0; i < initialCapacityOrValues.length; i++) {
            buffer.set(i, initialCapacityOrValues[i]);
        }
        return buffer;
    }
    return createTypedBufferInternal<S>(schema, initialCapacityOrValues ?? 16);
}

function createTypedBufferInternal <S extends Schema>(
    schema: S,
    initialCapacity: number,
): TypedBuffer<FromSchema<S>> {
    
    if (schema.const !== undefined) {
        return createConstBuffer(schema, initialCapacity) as TypedBuffer<FromSchema<S>>;
    }

    if (schema.type === 'number' || schema.type === 'integer') {
        return createNumberBuffer(schema, initialCapacity) as TypedBuffer<FromSchema<S>>;
    }

    // If schema has layout property, it should be treated as a struct layout
    const shouldBeStruct = schema.layout !== undefined;
    const structLayout = getStructLayout(schema, shouldBeStruct);
    if (structLayout) {
        return createStructBuffer(schema, initialCapacity);
    }

    return createArrayBuffer(schema, initialCapacity);
}
