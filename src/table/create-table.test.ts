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
import { createTable } from "./create-table.js";
import { addRow } from "./add-row.js";

describe("createTable", () => {
    it("should create columns for each schema", () => {
        const schemas = {
            a: { type: "number" },
            b: { type: "string" },
        } as const;

        const table = createTable(schemas);

        expect(table.columns.a).toBeDefined();
        expect(table.columns.b).toBeDefined();
        expect(Object.keys(table.columns)).toHaveLength(2);
    });

    it("should initialize with 0 rows", () => {
        const schemas = { a: { type: "number" } } as const;
        const table = createTable(schemas);
        expect(table.rowCount).toBe(0);
    });

}); 