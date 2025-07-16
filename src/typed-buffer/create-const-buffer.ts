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
import { TypedBuffer } from "./typed-buffer.js";

export const constBufferType = "const";
export const createConstBuffer = <T>(
    value: T,
): TypedBuffer<T> => {
    let capacity = 0;
    let length = 0;
    const typedBuffer: TypedBuffer<T> = {
        type: constBufferType,
        schema: { const: value },
        typedArrayElementSizeInBytes: 0,
        getTypedArray() {
            throw new Error("Const buffer does not support getTypedArray");
        },
        get length(): number {
            return length;
        },
        set length(value: number) {
            length = value;
        },
        get capacity(): number {
            return capacity;
        },
        set capacity(value: number) {
            capacity = value;
        },
        get(index: number): T {
            return value;
        },
        set(index: number, value: T): void {
            // No-op: const buffer ignores set calls
        },
        copyWithin(target: number, start: number, end: number): void {
            // No-op: const buffer copyWithin is a no-op
        },
        slice(start = 0, end = capacity): ArrayLike<T> & Iterable<T> {
            return Array(Math.max(0, end - start)).fill(value);
        },
    };
    
    return typedBuffer;
}; 