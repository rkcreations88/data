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
import { Table } from "./table.js";
import { createTable } from "./create-table.js";
import { addRow } from "./add-row.js";
import { deleteRow } from "./delete-row.js";
import { U32Schema } from "../schema/u32.js";
import { F32Schema } from "../schema/f32.js";

describe("Table.compact", () => {
    it("should reduce rowCapacity to match rowCount after deletions", () => {
        const table = createTable({
            value: U32Schema,
        });

        // Add some rows
        addRow(table, { value: 1 });
        addRow(table, { value: 2 });
        addRow(table, { value: 3 });
        addRow(table, { value: 4 });

        expect(table.rowCount).toBe(4);
        const initialCapacity = table.rowCapacity;
        expect(initialCapacity).toBeGreaterThanOrEqual(4);

        // Delete some rows
        deleteRow(table, 3);
        deleteRow(table, 2);

        expect(table.rowCount).toBe(2);
        expect(table.rowCapacity).toBe(initialCapacity); // Capacity unchanged

        // Compact the table
        Table.compact(table);

        expect(table.rowCount).toBe(2);
        expect(table.rowCapacity).toBe(2); // Capacity now matches rowCount
    });

    it("should compact all columns to the same capacity", () => {
        const table = createTable({
            value: U32Schema,
            score: F32Schema,
        });

        addRow(table, { value: 1, score: 1.5 });
        addRow(table, { value: 2, score: 2.5 });
        addRow(table, { value: 3, score: 3.5 });
        deleteRow(table, 2);

        Table.compact(table);

        expect(table.columns.value.capacity).toBe(2);
        expect(table.columns.score.capacity).toBe(2);
        expect(table.rowCapacity).toBe(2);
    });

    it("should preserve data after compaction", () => {
        const table = createTable({
            value: U32Schema,
        });

        addRow(table, { value: 10 });
        addRow(table, { value: 20 });
        addRow(table, { value: 30 });
        deleteRow(table, 2);

        Table.compact(table);

        expect(table.columns.value.get(0)).toBe(10);
        expect(table.columns.value.get(1)).toBe(20);
    });

    it("should do nothing if rowCapacity already equals rowCount", () => {
        const table = createTable({
            value: U32Schema,
        });

        addRow(table, { value: 1 });
        addRow(table, { value: 2 });

        // Compact once
        Table.compact(table);
        const capacity = table.rowCapacity;

        // Compact again
        Table.compact(table);

        expect(table.rowCapacity).toBe(capacity);
    });

    it("should handle empty tables", () => {
        const table = createTable({
            value: U32Schema,
        });

        Table.compact(table);

        expect(table.rowCount).toBe(0);
        expect(table.rowCapacity).toBe(0);
    });

    it("should handle tables that have grown and then had all rows deleted", () => {
        const table = createTable({
            value: U32Schema,
        });

        // Add many rows to trigger capacity growth
        for (let i = 0; i < 20; i++) {
            addRow(table, { value: i });
        }

        expect(table.rowCount).toBe(20);
        const largeCapacity = table.rowCapacity;
        expect(largeCapacity).toBeGreaterThanOrEqual(20);

        // Delete all rows
        for (let i = 19; i >= 0; i--) {
            deleteRow(table, i);
        }

        expect(table.rowCount).toBe(0);
        expect(table.rowCapacity).toBe(largeCapacity); // Still has large capacity

        Table.compact(table);

        expect(table.rowCount).toBe(0);
        expect(table.rowCapacity).toBe(0); // Capacity compacted to 0
    });
});

