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

export const createArrayBuffer = <T>(args: {
    length?: number,
}): TypedBuffer<T> => {
    const {
        length = 16,
    } = args;
    const array = new Array<T>(length);
    const typedBuffer = {
        type: 'array-buffer',
        typedArrayElementSizeInBytes: 0,
        getTypedArray() {
            throw new Error("Typed array not supported");
        },
        get size(): number {
            return array.length;
        },
        set size(value: number) {
            array.length = value;
        },
        get(index: number): T {
            return array[index];
        },
        set(index: number, value: T): void {
            array[index] = value;
        },
        copyWithin(target: number, start: number, end: number): void {
            array.copyWithin(target, start, end);
        },
        slice(start = 0, end = array.length): ArrayLike<T> {
            if (start === 0 && end === array.length) {
                return array;
            }
            return array.slice(start, end);
        },
    } as const satisfies TypedBuffer<T>;
    return typedBuffer;
}