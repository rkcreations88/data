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
import { createArrayBuffer } from "./create-array-buffer.js";
import { Schema } from "../schema/schema.js";

describe("createArrayBuffer.copy", () => {
    it("should copy elements and capacity into a new array", () => {
        const buf = createArrayBuffer({ type: "string" }, 3);
        buf.set(0, "hello");
        buf.set(1, "world");
        buf.set(2, "test");

        const copy = buf.copy();
        expect(copy.capacity).toBe(3);
        expect(copy.get(0)).toBe("hello");
        expect(copy.get(1)).toBe("world");
        expect(copy.get(2)).toBe("test");

        // mutate original, copy should not change
        buf.set(0, "changed");
        expect(copy.get(0)).toBe("hello");
    });

    it("should perform shallow copy for object elements", () => {
        const schema = { type: "array", items: { type: "number" } } as const satisfies Schema;
        const buf = createArrayBuffer(schema, 2);
        const arr1 = [1, 2, 3];
        const arr2 = [4, 5, 6];
        buf.set(0, arr1);
        buf.set(1, arr2);

        const copy = buf.copy();
        expect(copy.get(0)).toBe(arr1); // same reference
        expect(copy.get(1)).toBe(arr2); // same reference
    });
});


