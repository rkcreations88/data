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
import { DataView32 } from "../internal/data-view-32/data-view-32.js";
import { createDataView32 } from "../internal/data-view-32/create-data-view-32.js";
import { FromSchema, Schema } from "../schema/schema.js";
import { createReadStruct } from "./structs/create-read-struct.js";
import { createWriteStruct } from "./structs/create-write-struct.js";
import { getStructLayout } from "./structs/get-struct-layout.js";
import { TypedBuffer } from "./typed-buffer.js";
import { TypedArray } from "../internal/typed-array/index.js";
import { createSharedArrayBuffer } from "../internal/shared-array-buffer/create-shared-array-buffer.js";

export const createStructBuffer = <S extends Schema, ArrayType extends keyof DataView32 = "f32">(
    args: {
        schema: S,
        length?: number,
        maxLength?: number,
        arrayBuffer?: ArrayBufferLike,
        arrayType?: ArrayType
    }
): TypedBuffer<FromSchema<S>> => {
    const { schema } = args;
    const layout = getStructLayout(schema);
    if (!layout) {
        throw new Error("Schema is not a valid struct schema");
    }
    const { length = 16, arrayType = 'f32' } = args;
    let arrayBuffer = args.arrayBuffer ?? createSharedArrayBuffer(length * layout.size);
    const read = createReadStruct<FromSchema<S>>(layout);
    const write = createWriteStruct<FromSchema<S>>(layout);

    let dataView = createDataView32(arrayBuffer);
    const sizeInQuads = layout.size / 4;

    let typedArray: TypedArray = dataView[arrayType];

    const buffer: TypedBuffer<FromSchema<S>> = {
        type: 'struct-buffer',
        typedArrayElementSizeInBytes: layout.size,
        getTypedArray() {
            return typedArray;
        },
        get size() {
            return arrayBuffer.byteLength / layout.size;
        },
        set size(length: number) {
            arrayBuffer = grow(arrayBuffer, length * layout.size);
            dataView = createDataView32(arrayBuffer);
            typedArray = dataView[arrayType] as DataView32[ArrayType];
        },
        get: (index: number) => read(dataView, index),
        set: (index: number, value: FromSchema<S>) => write(dataView, index, value),
        copyWithin: (target: number, start: number, end: number) => {
            dataView[arrayType].copyWithin(target * sizeInQuads, start * sizeInQuads, end * sizeInQuads);
        },
        slice(start = 0, end = buffer.size): ArrayLike<FromSchema<S>> {
            const result = new Array<FromSchema<S>>(Math.max(0, end - start));
            for (let i = start; i < end && i < buffer.size; i++) {
                result[i - start] = read(dataView, i);
            }
            return result;
        },
    };
    return buffer;
}
