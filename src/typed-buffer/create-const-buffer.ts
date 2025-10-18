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
import { Schema } from "../schema/schema.js";
import { TypedBuffer, TypedBufferType } from "./typed-buffer.js";
import { TypedArray } from "../internal/typed-array/index.js";

export const constBufferType = "const";

class ConstTypedBuffer<T> extends TypedBuffer<T> {

    public capacity: number;
    private readonly constValue: T;
    public readonly type: TypedBufferType = constBufferType;

    constructor(schema: Schema, initialCapacity: number) {
        super(schema);
        this.capacity = initialCapacity;
        this.constValue = schema.const;
    }

    get typedArrayElementSizeInBytes(): number {
        return 0;
    }

    getTypedArray(): TypedArray {
        throw new Error("Const buffer does not support getTypedArray");
    }

    get(_index: number): T {
        return this.constValue;
    }

    set(_index: number, _value: T): void {
        // No-op: const buffer ignores set calls
    }

    copyWithin(_target: number, _start: number, _end: number): void {
        // No-op: const buffer copyWithin is a no-op
    }

    slice(start = 0, end = this.capacity): ArrayLike<T> & Iterable<T> {
        return Array(Math.max(0, end - start)).fill(this.constValue);
    }

    copy(): TypedBuffer<T> {
        return this;
    }
}

export const createConstBuffer = <T>(
    schema: Schema,
    initialCapacity: number,
): TypedBuffer<T> => {
    return new ConstTypedBuffer<T>(schema, initialCapacity);
};
