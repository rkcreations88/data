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
import { TypedArrayConstructor, TypedArray } from "../internal/typed-array/index.js";
import { U32Schema } from "../schema/u32.js";
import { TypedBuffer, TypedBufferType } from "./typed-buffer.js";
import { createSharedArrayBuffer } from "../internal/shared-array-buffer/create-shared-array-buffer.js";

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

export const numberBufferType = "number";

class NumberTypedBuffer extends TypedBuffer<number> {
    public readonly type: TypedBufferType = numberBufferType;
    public readonly typedArrayElementSizeInBytes: number;
    
    private arrayBuffer: ArrayBuffer | SharedArrayBuffer;
    private array: TypedArray;
    private readonly typedArrayConstructor: TypedArrayConstructor;
    private _capacity: number;

    constructor(schema: Schema, initialCapacity: number) {
        super(schema);
        this.typedArrayConstructor = getTypedArrayConstructor(schema);
        this.typedArrayElementSizeInBytes = this.typedArrayConstructor.BYTES_PER_ELEMENT;
        this._capacity = initialCapacity;
        this.arrayBuffer = createSharedArrayBuffer(this.typedArrayElementSizeInBytes * initialCapacity);
        this.array = new this.typedArrayConstructor(this.arrayBuffer);
    }

    get capacity(): number {
        return this._capacity;
    }

    set capacity(value: number) {
        if (value !== this._capacity) {
            this._capacity = value;
            this.arrayBuffer = grow(this.arrayBuffer, value * this.typedArrayElementSizeInBytes);
            this.array = new this.typedArrayConstructor(this.arrayBuffer);
        }
    }

    getTypedArray(): TypedArray {
        return this.array;
    }

    get(index: number): number {
        return this.array[index];
    }

    set(index: number, value: number): void {
        this.array[index] = value;
    }

    copyWithin(target: number, start: number, end: number): void {
        this.array.copyWithin(target, start, end);
    }

    slice(start = 0, end = this._capacity): ArrayLike<number> & Iterable<number> {
        return this.array.subarray(start, end);
    }
}

export const createNumberBuffer = (
    schema: Schema,
    initialCapacity: number,
): TypedBuffer<number> => {
    return new NumberTypedBuffer(schema, initialCapacity);
};