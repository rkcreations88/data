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
import { createArchetype } from "./create-archetype.js";
import { compactArchetype } from "./compact-archetype.js";
import { deleteRow } from "./delete-row.js";
import { createEntityLocationTable } from "../entity-location-table/index.js";
import { schema } from "../entity.js";
import { U32Schema } from "../../schema/u32.js";

describe("compactArchetype", () => {
    it("should compact archetype after entity deletions", () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { id: schema, value: U32Schema },
            1,
            entityLocationTable
        );

        // Create entities
        const entity1 = archetype.insert({ value: 10 });
        const entity2 = archetype.insert({ value: 20 });
        const entity3 = archetype.insert({ value: 30 });
        const entity4 = archetype.insert({ value: 40 });

        expect(archetype.rowCount).toBe(4);
        const initialCapacity = archetype.rowCapacity;

        // Delete some entities
        deleteRow(archetype, 3, entityLocationTable);
        deleteRow(archetype, 2, entityLocationTable);

        expect(archetype.rowCount).toBe(2);
        expect(archetype.rowCapacity).toBe(initialCapacity);

        // Compact the archetype
        compactArchetype(archetype);

        expect(archetype.rowCount).toBe(2);
        expect(archetype.rowCapacity).toBe(2);
    });

    it("should preserve entity data after compaction", () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { id: schema, value: U32Schema },
            1,
            entityLocationTable
        );

        const entity1 = archetype.insert({ value: 100 });
        const entity2 = archetype.insert({ value: 200 });
        const entity3 = archetype.insert({ value: 300 });

        deleteRow(archetype, 2, entityLocationTable);

        compactArchetype(archetype);

        expect(archetype.columns.value.get(0)).toBe(100);
        expect(archetype.columns.value.get(1)).toBe(200);
        expect(archetype.columns.id.get(0)).toBe(entity1);
        expect(archetype.columns.id.get(1)).toBe(entity2);
    });

    it("should handle empty archetypes", () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { id: schema, value: U32Schema },
            1,
            entityLocationTable
        );

        compactArchetype(archetype);

        expect(archetype.rowCount).toBe(0);
        expect(archetype.rowCapacity).toBe(0);
    });
});

