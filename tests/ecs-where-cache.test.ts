import { describe, it, expect, beforeEach } from 'vitest';
import { createECS } from '../src/ecs/ecs/ecs.js';
import { Archetype } from '../src/ecs/ecs/ecs-types.js';
import { Schema } from '../src/core/schema.js';

describe('ECS Where Clause Behavior', () => {
    // Define our component types
    type Components = {
        id: number;
        position: { x: number; y: number };
        velocity: { x: number; y: number };
        health: number;
        isActive: boolean;
    };

    // Define our archetypes
    type Archetypes = {
        moving: Archetype<{ id: number; position: Components['position']; velocity: Components['velocity'] }>;
        living: Archetype<{ id: number; position: Components['position']; health: Components['health'] }>;
    };

    let ecs: ReturnType<typeof createECS<Components, Archetypes>>;

    beforeEach(() => {
        // Create a fresh ECS instance before each test
        ecs = createECS<Components, Archetypes>();

        // Define our components
        ecs.withComponents({
            id: { type: 'number' } as Schema,
            position: {
                type: 'object',
                properties: {
                    x: { type: 'number' },
                    y: { type: 'number' }
                },
                required: ['x', 'y'],
                additionalProperties: false
            } as Schema,
            velocity: {
                type: 'object',
                properties: {
                    x: { type: 'number' },
                    y: { type: 'number' }
                },
                required: ['x', 'y'],
                additionalProperties: false
            } as Schema,
            health: { type: 'number' } as Schema,
            isActive: { type: 'boolean' } as Schema,
        });

        // Define our archetypes
        ecs.withArchetypes({
            moving: ['id', 'position', 'velocity'],
            living: ['id', 'position', 'health'],
        });
    });

    it('should properly filter entities based on where clause', () => {
        // Create some entities
        const entity1 = ecs.createEntity(ecs.archetypes.moving, {
            position: { x: 0, y: 0 },
            velocity: { x: 1, y: 1 },
        });

        const entity2 = ecs.createEntity(ecs.archetypes.moving, {
            position: { x: 10, y: 10 },
            velocity: { x: -1, y: -1 },
        });

        // First query - should return entities with x > 5
        const firstResults = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(firstResults).toHaveLength(1);
        expect(firstResults[0].id).toBe(entity2);

        // Update entity2's position
        ecs.updateEntity(entity2, {
            position: { x: 0, y: 0 },
        });

        // Second query - should return updated results
        const secondResults = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(secondResults).toHaveLength(0);
    });

    it('should handle multiple where clauses independently', () => {
        // Create entities
        const entity1 = ecs.createEntity(ecs.archetypes.moving, {
            position: { x: 0, y: 0 },
            velocity: { x: 1, y: 1 },
        });

        const entity2 = ecs.createEntity(ecs.archetypes.moving, {
            position: { x: 10, y: 10 },
            velocity: { x: -1, y: -1 },
        });

        // Query with first where clause
        const results1 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(results1).toHaveLength(1);
        expect(results1[0].id).toBe(entity2);

        // Query with different where clause
        const results2 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { velocity: { x: { '<': 0 } } },
        });
        expect(results2).toHaveLength(1);
        expect(results2[0].id).toBe(entity2);

        // Update entity2's velocity
        ecs.updateEntity(entity2, {
            velocity: { x: 1, y: -1 },
        });

        // Verify position query still works
        const results3 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(results3).toHaveLength(1);

        // Verify velocity query returns updated results
        const results4 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { velocity: { x: { '<': 0 } } },
        });
        expect(results4).toHaveLength(0);
    });

    it('should handle entity deletion correctly', () => {
        // Create entities
        const entity1 = ecs.createEntity(ecs.archetypes.moving, {
            position: { x: 0, y: 0 },
            velocity: { x: 1, y: 1 },
        });

        const entity2 = ecs.createEntity(ecs.archetypes.moving, {
            position: { x: 10, y: 10 },
            velocity: { x: -1, y: -1 },
        });

        // Query to verify initial state
        const results1 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(results1).toHaveLength(1);
        expect(results1[0].id).toBe(entity2);

        // Delete entity2
        ecs.deleteEntity(entity2);

        // Verify query returns updated results
        const results2 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(results2).toHaveLength(0);
    });

    it('should handle component removal correctly', () => {
        // Create entity with both position and velocity
        const entity = ecs.createEntity(ecs.archetypes.moving, {
            position: { x: 10, y: 10 },
            velocity: { x: 1, y: 1 },
        });

        // Query to verify initial state
        const results1 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(results1).toHaveLength(1);

        // Remove position component
        ecs.setComponentValue(entity, 'position', undefined);

        // Verify query returns updated results
        const results2 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(results2).toHaveLength(0);
    });

    it('should handle archetype changes correctly', () => {
        // Create entity with position and velocity
        const entity = ecs.createEntity(ecs.archetypes.moving, {
            position: { x: 10, y: 10 },
            velocity: { x: 1, y: 1 },
        });

        // Query to verify initial state
        const results1 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(results1).toHaveLength(1);

        // Remove velocity component, changing archetype
        ecs.setComponentValue(entity, 'velocity', undefined);

        // Verify query returns updated results
        const results2 = ecs.selectEntityValues(ecs.archetypes.moving, {
            where: { position: { x: { '>': 5 } } },
        });
        expect(results2).toHaveLength(0);
    });
}); 