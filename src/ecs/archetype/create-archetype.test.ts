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
import { createArchetype } from '../archetype/index.js';
import { createEntityLocationTable } from '../entity-location-table/index.js';
import { Entity } from '../entity.js';
import { U32 } from '../../math/u32/index.js';

describe('createArchetype', () => {
    it('should create an archetype with basic components', () => {
        const entityLocationTable = createEntityLocationTable();
        const components = {
            id: Entity.schema,
            value: U32.schema,
        };
        const id = 1;

        const archetype = createArchetype(components, id, entityLocationTable);

        // Verify basic properties
        expect(archetype.id).toBe(id);
        expect(archetype.rowCount).toBe(0);
        expect(archetype.components).toEqual(new Set(['id', 'value']));
        expect(archetype.columns).toHaveProperty('id');
        expect(archetype.columns).toHaveProperty('value');
    });

    it('should create entities with correct ids and data', () => {
        const entityLocationTable = createEntityLocationTable();
        const components = {
            id: Entity.schema,
            value: U32.schema,
        };
        const id = 1;

        const archetype = createArchetype(components, id, entityLocationTable);

        // Create first entity
        const entity1 = archetype.insert({ value: 42 });
        expect(entity1).toBe(0); // First entity should have id 0
        expect(archetype.rowCount).toBe(1);
        expect(archetype.columns.id.get(0)).toBe(0);
        expect(archetype.columns.value.get(0)).toBe(42);

        // Create second entity
        const entity2 = archetype.insert({ value: 100 });
        expect(entity2).toBe(1); // Second entity should have id 1
        expect(archetype.rowCount).toBe(2);
        expect(archetype.columns.id.get(1)).toBe(1);
        expect(archetype.columns.value.get(1)).toBe(100);

        // Verify entity locations in EntityLocationTable
        const location1 = entityLocationTable.locate(entity1);
        expect(location1).toEqual({ archetype: id, row: 0 });

        const location2 = entityLocationTable.locate(entity2);
        expect(location2).toEqual({ archetype: id, row: 1 });
    });

    it('should handle multiple component types', () => {
        const entityLocationTable = createEntityLocationTable();
        const components = {
            id: Entity.schema,
            health: U32.schema,
            mana: U32.schema,
            level: U32.schema,
        };
        const id = 2;

        const archetype = createArchetype(components, id, entityLocationTable);

        // Verify components are set up correctly
        expect(archetype.components).toEqual(new Set(['id', 'health', 'mana', 'level']));
        expect(archetype.columns).toHaveProperty('health');
        expect(archetype.columns).toHaveProperty('mana');
        expect(archetype.columns).toHaveProperty('level');

        // Create an entity with all components
        const entity = archetype.insert({
            health: 100,
            mana: 50,
            level: 5,
        });

        expect(entity).toBe(0);
        expect(archetype.rowCount).toBe(1);
        expect(archetype.columns.health.get(0)).toBe(100);
        expect(archetype.columns.mana.get(0)).toBe(50);
        expect(archetype.columns.level.get(0)).toBe(5);
        expect(archetype.columns.id.get(0)).toBe(0);

        // Verify entity location
        const location = entityLocationTable.locate(entity);
        expect(location).toEqual({ archetype: id, row: 0 });
    });

    it('should serialize and deserialize archetype data correctly', () => {
        const entityLocationTable = createEntityLocationTable();
        const components = {
            id: Entity.schema,
            health: U32.schema,
            mana: U32.schema,
        };
        const id = 3;

        const archetype = createArchetype(components, id, entityLocationTable);

        // Add some data
        archetype.insert({ health: 100, mana: 50 });
        archetype.insert({ health: 75, mana: 25 });

        // Serialize the archetype
        const serializedData = archetype.toData();

        // Verify serialized data contains expected properties
        expect(serializedData).toHaveProperty('rowCount', 2);
        expect(serializedData).toHaveProperty('columns');
        expect((serializedData as any).columns).toHaveProperty('id');
        expect((serializedData as any).columns).toHaveProperty('health');
        expect((serializedData as any).columns).toHaveProperty('mana');

        // Create a new archetype and restore from serialized data
        const newArchetype = createArchetype(components, id, entityLocationTable);
        newArchetype.fromData(serializedData);

        // Verify the restored archetype has the same data
        expect(newArchetype.rowCount).toBe(2);
        expect(newArchetype.columns.health.get(0)).toBe(100);
        expect(newArchetype.columns.health.get(1)).toBe(75);
        expect(newArchetype.columns.mana.get(0)).toBe(50);
        expect(newArchetype.columns.mana.get(1)).toBe(25);
        expect(newArchetype.columns.id.get(0)).toBe(0);
        expect(newArchetype.columns.id.get(1)).toBe(1);
    });

    it('should preserve component set during serialization/deserialization', () => {
        const entityLocationTable = createEntityLocationTable();
        const components = {
            id: Entity.schema,
            value: U32.schema,
        };
        const id = 4;

        const archetype = createArchetype(components, id, entityLocationTable);
        const originalComponentSet = archetype.components;

        // Serialize and deserialize
        const serializedData = archetype.toData();
        archetype.fromData(serializedData);

        // Component set should remain unchanged (same reference)
        expect(archetype.components).toBe(originalComponentSet);
        expect(archetype.components).toEqual(new Set(['id', 'value']));
    });
}); 