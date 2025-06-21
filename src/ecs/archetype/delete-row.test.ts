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
import { describe, it, expect } from 'vitest';
import { createEntityLocationTable } from '../entity-location-table/index.js';
import { createArchetype, deleteRow } from './index.js';
import { EntitySchema } from '../entity.js';
import { U32Schema } from '../../schema/u32.js';

describe('Archetype_deleteRow', () => {
    it('should delete a row from the middle and update moved entity location', () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { 
                id: EntitySchema,
                value: U32Schema 
            },
            1,
            entityLocationTable
        );

        // Create three entities
        const entity1 = archetype.insert({ value: 100 });
        const entity2 = archetype.insert({ value: 200 });
        const entity3 = archetype.insert({ value: 300 });

        // Delete the middle entity (entity2)
        deleteRow(archetype, entity2, entityLocationTable);

        // Verify entity3 was moved to position 1
        expect(archetype.columns.id.get(1)).toBe(entity3);
        expect(archetype.columns.value.get(1)).toBe(300);

        // Verify entity location table was updated for the moved entity
        const movedEntityLocation = entityLocationTable.locate(entity3);
        expect(movedEntityLocation).toEqual({ archetype: 1, row: 1 });

        // Verify total rows decreased
        expect(archetype.rows).toBe(2);

        // Verify entity1 is unchanged
        expect(archetype.columns.id.get(0)).toBe(entity1);
        expect(archetype.columns.value.get(0)).toBe(100);
    });

    it('should handle deleting the last row without moving entities', () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { 
                id: EntitySchema,
                value: U32Schema 
            },
            1,
            entityLocationTable
        );

        // Create two entities
        const entity1 = archetype.insert({ value: 100 });
        const entity2 = archetype.insert({ value: 200 });

        // Delete the last entity (entity2)
        deleteRow(archetype, entity2, entityLocationTable);

        // Verify total rows decreased
        expect(archetype.rows).toBe(1);

        // Verify entity1 is unchanged
        expect(archetype.columns.id.get(0)).toBe(entity1);
        expect(archetype.columns.value.get(0)).toBe(100);
    });

    it('should handle deleting the only row', () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { 
                id: EntitySchema,
                value: U32Schema 
            },
            1,
            entityLocationTable
        );

        // Create one entity
        const entity1 = archetype.insert({ value: 100 });

        // Delete the only entity
        deleteRow(archetype, 0, entityLocationTable);

        // Verify total rows is zero
        expect(archetype.rows).toBe(0);
    });
}); 