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
import { copy } from "./copy.js";

/**
 * Resizes an ArrayBuffer to a new capacity, preserving data up to the minimum of old and new sizes.
 * Can be used for both growing and shrinking.
 */
export function resize<T extends ArrayBufferLike>(arrayBuffer: T, newCapacity: number): T {
    const constructor = arrayBuffer.constructor as new (size: number) => T;
    const newArrayBuffer = new constructor(newCapacity);
    // Copy only the amount that fits in the new buffer
    const copyLength = Math.min(arrayBuffer.byteLength, newCapacity);
    copy(arrayBuffer, newArrayBuffer, copyLength);
    return newArrayBuffer;
}
