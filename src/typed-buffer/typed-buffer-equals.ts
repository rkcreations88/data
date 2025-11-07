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
import { equals } from "../equals.js";
import { ReadonlyTypedBuffer } from "./typed-buffer.js";

export function typedBufferEquals(
    a: ReadonlyTypedBuffer<unknown>,
    b: ReadonlyTypedBuffer<unknown>
): boolean {
    if (a === b) return true;                        // same reference

    // cheap structural checks first
    if (a.type !== b.type ||
        a.capacity !== b.capacity) return false;

    // compare schemas using equals function
    if (!equals(a.schema, b.schema)) return false;

    // fallback: per-element recursive compare
    const capacity = a.capacity;
    for (let i = 0; i < capacity; i++) {
        if (!equals(a.get(i), b.get(i))) return false;
    }
    return true;
}
