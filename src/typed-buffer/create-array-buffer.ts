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
import { FromSchema, Schema } from "../schema/schema.js";
import { TypedBuffer, TypedBufferType } from "./typed-buffer.js";
import { TypedArray } from "../internal/typed-array/index.js";

export const arrayBufferType = "array";

class ArrayTypedBuffer<T> extends TypedBuffer<T> {
    public readonly type: TypedBufferType = arrayBufferType;
    public readonly typedArrayElementSizeInBytes: number = 0;
    
    private array: T[];

    constructor(schema: Schema, initialCapacity: number) {
        super(schema);
        this.array = new Array<T>(initialCapacity);
    }

    get capacity(): number {
        return this.array.length;
    }

    set capacity(value: number) {
        this.array.length = value;
    }

    getTypedArray(): TypedArray {
        throw new Error("Typed array not supported");
    }

    get(index: number): T {
        return this.array[index];
    }

    set(index: number, value: T): void {
        this.array[index] = value;
    }

    copyWithin(target: number, start: number, end: number): void {
        this.array.copyWithin(target, start, end);
    }

    slice(start = 0, end = this.array.length): ArrayLike<T> & Iterable<T> {
        if (start === 0 && end === this.array.length) {
            return this.array;
        }
        return this.array.slice(start, end);
    }
}

export const createArrayBuffer = <S extends Schema, T = FromSchema<S>>(
    schema: S,
    initialCapacity: number,
): TypedBuffer<T> => {
    return new ArrayTypedBuffer<T>(schema, initialCapacity);
};
