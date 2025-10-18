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
import { describe, it, expect } from "vitest";
import { createNumberBuffer } from "./create-number-buffer.js";
import { F32Schema } from "../schema/f32.js";

describe("createNumberBuffer.copy", () => {
    it("should copy contents and capacity into a new underlying buffer", () => {
        const buf = createNumberBuffer(F32Schema, 4);
        buf.set(0, 1);
        buf.set(1, 2);
        buf.set(2, 3);
        buf.set(3, 4);

        const copy = buf.copy();

        expect(copy.capacity).toBe(4);
        expect(copy.get(0)).toBe(1);
        expect(copy.get(1)).toBe(2);
        expect(copy.get(2)).toBe(3);
        expect(copy.get(3)).toBe(4);

        const srcTA = buf.getTypedArray();
        const dstTA = copy.getTypedArray();
        expect(dstTA).not.toBe(srcTA);
        // buffers should be different
        expect(dstTA.buffer).not.toBe(srcTA.buffer);

        // mutate original, copy should not change
        buf.set(0, 42);
        expect(copy.get(0)).toBe(1);
    });
});


