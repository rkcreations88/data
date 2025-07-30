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
import { TypedBuffer, TypedBufferType } from "./typed-buffer.js";
import { TypedArray } from "../internal/typed-array/index.js";
import { createSharedArrayBuffer } from "../internal/shared-array-buffer/create-shared-array-buffer.js";

export const structBufferType = "struct";

class StructTypedBuffer<S extends Schema, ArrayType extends keyof DataView32 = "f32"> extends TypedBuffer<FromSchema<S>> {
    public readonly type: TypedBufferType = structBufferType;
    public readonly typedArrayElementSizeInBytes: number;
    
    private arrayBuffer: ArrayBuffer | SharedArrayBuffer;
    private dataView: DataView32;
    private typedArray: TypedArray;
    private readonly layout: NonNullable<ReturnType<typeof getStructLayout>>;
    private readonly read: ReturnType<typeof createReadStruct<FromSchema<S>>>;
    private readonly write: ReturnType<typeof createWriteStruct<FromSchema<S>>>;
    private readonly sizeInQuads: number;
    private readonly arrayType: ArrayType;
    private _capacity: number;

    constructor(schema: S, initialCapacityOrArrayBuffer: number | ArrayBuffer) {
        super(schema);
        
        const layout = getStructLayout(schema);
        if (!layout) {
            throw new Error("Schema is not a valid struct schema");
        }
        
        this.layout = layout;
        this.typedArrayElementSizeInBytes = this.layout.size;
        this.arrayType = 'f32' as ArrayType;
        this.sizeInQuads = this.layout.size / 4;
        
        this.arrayBuffer
            = initialCapacityOrArrayBuffer instanceof ArrayBuffer
            ? initialCapacityOrArrayBuffer
            : createSharedArrayBuffer(initialCapacityOrArrayBuffer * this.layout.size);
        this.dataView = createDataView32(this.arrayBuffer);
        this.typedArray = this.dataView[this.arrayType];
        this._capacity = this.typedArray.length / this.sizeInQuads;
        
        this.read = createReadStruct<FromSchema<S>>(this.layout);
        this.write = createWriteStruct<FromSchema<S>>(this.layout);
    }

    get capacity(): number {
        return this._capacity;
    }

    set capacity(value: number) {
        if (value !== this._capacity) {
            this._capacity = value;
            this.arrayBuffer = grow(this.arrayBuffer, value * this.layout.size);
            this.dataView = createDataView32(this.arrayBuffer);
            this.typedArray = this.dataView[this.arrayType];
        }
    }

    getTypedArray(): TypedArray {
        return this.typedArray;
    }

    get(index: number): FromSchema<S> {
        return this.read(this.dataView, index);
    }

    set(index: number, value: FromSchema<S>): void {
        this.write(this.dataView, index, value);
    }

    copyWithin(target: number, start: number, end: number): void {
        this.dataView[this.arrayType].copyWithin(target * this.sizeInQuads, start * this.sizeInQuads, end * this.sizeInQuads);
    }

    slice(start = 0, end = this._capacity): ArrayLike<FromSchema<S>> & Iterable<FromSchema<S>> {
        const result = new Array<FromSchema<S>>(Math.max(0, end - start));
        for (let i = start; i < end; i++) {
            result[i - start] = this.read(this.dataView, i);
        }
        return result;
    }
}

export function createStructBuffer<S extends Schema, ArrayType extends keyof DataView32 = "f32">(
    schema: S,
    initialCapacity: number,
): TypedBuffer<FromSchema<S>>
export function createStructBuffer<S extends Schema, ArrayType extends keyof DataView32 = "f32">(
    schema: S,
    arrayBuffer: ArrayBuffer,
): TypedBuffer<FromSchema<S>>
export function createStructBuffer<S extends Schema, ArrayType extends keyof DataView32 = "f32">(
    schema: S,
    initialCapacityOrArrayBuffer: number | ArrayBuffer,
): TypedBuffer<FromSchema<S>> {
    return new StructTypedBuffer<S, ArrayType>(schema, initialCapacityOrArrayBuffer);
};
