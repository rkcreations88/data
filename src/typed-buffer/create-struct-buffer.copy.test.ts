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
import { createStructBuffer } from "./create-struct-buffer.js";
import type { Schema } from "../schema/schema.js";

describe("createStructBuffer.copy", () => {
    it("should deep-copy the underlying bytes and preserve capacity", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                a: { type: "number", precision: 1 },
                b: { type: "number", precision: 1 },
                c: { type: "number", precision: 1 },
            },
            layout: "packed"
        };

        const buf = createStructBuffer(schema, 2);
        buf.set(0, { a: 1, b: 2, c: 3 });
        buf.set(1, { a: 4, b: 5, c: 6 });

        const copy = buf.copy();
        expect(copy.capacity).toBe(2);
        expect(copy.get(0)).toEqual({ a: 1, b: 2, c: 3 });
        expect(copy.get(1)).toEqual({ a: 4, b: 5, c: 6 });

        // Mutate original and ensure copy is unaffected
        buf.set(0, { a: 7, b: 8, c: 9 });
        expect(copy.get(0)).toEqual({ a: 1, b: 2, c: 3 });
    });
});


