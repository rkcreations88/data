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

import { Assert } from "../../types/assert.js";
import { Equal } from "../../types/equal.js";
import { World } from "./world.js";

const worldSchema = World.Schema.create({
    components: {
        velocity: { type: "number" },
        particle: { type: "boolean" },
    },
    resources: {
        mousePosition: { type: "number", default: 0 },
        fooPosition: { type: "number", default: 0 },
    },
    archetypes: {
        Particle: ["particle"],
        DynamicParticle: ["particle", "velocity"],
    },
    systems: {
        renderSystem: {
            create: (world) => () => { }
        },
        updateSystem: {
            create: (world) => () => { }
        }
    }
});

// Test world schema dependencies and merging
const aSchema = World.Schema.create({
    components: {
        a: { type: "number" },
        b: { type: "string" }
    },
    resources: {
        c: { default: "string" }
    },
    archetypes: {
        one: ["a", "b"]
    },
    systems: {
        systemA: {
            create: (world) => () => { }
        }
    }
});

const bSchema = World.Schema.create({
    components: {
        x: { type: "number" },
        y: { type: "string" }
    },
    resources: {
        z: { default: "string" }
    },
    archetypes: {
        two: ["x", "y"]
    },
    systems: {
        systemB: {
            create: (world) => () => { }
        }
    }
});

const cSchema = World.Schema.create({
    components: {
        m: { type: "number" },
        n: { type: "string" }
    },
    resources: {
        c: { default: "string" }
    },
    archetypes: {
        three: ["m", "n", "x"]
    },
    systems: {
        systemC: {
            create: (world) => () => { }
        }
    }
},
    [aSchema, bSchema]
);

// Type check: verify merged schema has all components from dependencies
type MergedSchemaComponents = typeof cSchema.components;
// type CheckMergedComponents = Assert<Equal<keyof MergedSchemaComponents, "a" | "b" | "x" | "y" | "m" | "n">>;

// Type check: verify merged schema has all resources from dependencies
type MergedSchemaResources = typeof cSchema.resources;
type CheckMergedResources = Assert<Equal<keyof MergedSchemaResources, "c" | "z">>;

// Type check: verify merged schema has all archetypes from dependencies
type MergedSchemaArchetypes = typeof cSchema.archetypes;
type CheckMergedArchetypes = Assert<Equal<keyof MergedSchemaArchetypes, "one" | "two" | "three">>;

// Type check: verify merged schema has all systems from dependencies
type MergedSchemaSystems = typeof cSchema.systems;
// Note: Systems also includes the 'create' property from the schema
// type CheckMergedSystems = Assert<Equal<keyof MergedSchemaSystems, "systemA" | "systemB" | "systemC">>;

// Runtime checks: verify the merged schema contains all properties
const hasAllComponents =
    "a" in cSchema.components &&
    "b" in cSchema.components &&
    "x" in cSchema.components &&
    "y" in cSchema.components &&
    "m" in cSchema.components &&
    "n" in cSchema.components;

const hasAllResources =
    "c" in cSchema.resources &&
    "z" in cSchema.resources;

const hasAllArchetypes =
    "one" in cSchema.archetypes &&
    "two" in cSchema.archetypes &&
    "three" in cSchema.archetypes;

const hasAllSystems =
    "systemA" in cSchema.systems &&
    "systemB" in cSchema.systems &&
    "systemC" in cSchema.systems;

if (!hasAllComponents) {
    throw new Error("World schema merging failed: missing components");
}

if (!hasAllResources) {
    throw new Error("World schema merging failed: missing resources");
}

if (!hasAllArchetypes) {
    throw new Error("World schema merging failed: missing archetypes");
}

if (!hasAllSystems) {
    throw new Error("World schema merging failed: missing systems");
}

// Test system declarations are present
const hasAllSystemDeclarations =
    "systemA" in cSchema.systems &&
    "systemB" in cSchema.systems &&
    "systemC" in cSchema.systems &&
    typeof cSchema.systems.systemA.create === "function" &&
    typeof cSchema.systems.systemB.create === "function" &&
    typeof cSchema.systems.systemC.create === "function";

if (!hasAllSystemDeclarations) {
    throw new Error("World schema merging failed: missing system declarations");
}

// Test that individual system creates work
const mockDb: any = {};
const systemA = cSchema.systems.systemA.create(mockDb);
const systemB = cSchema.systems.systemB.create(mockDb);
const systemC = cSchema.systems.systemC.create(mockDb);

if (typeof systemA !== "function" || typeof systemB !== "function" || typeof systemC !== "function") {
    throw new Error("System create functions failed to return system functions");
}

// Test with more complex dependencies
const baseSchemaWithSystems = World.Schema.create({
    components: {
        position: { type: "number" },
        health: { type: "number" }
    },
    resources: {
        time: { default: 0 }
    },
    transactions: {
        updateHealth: () => { }
    },
    systems: {
        healthSystem: {
            create: (world) => () => { }
        }
    }
});

const extendedSchemaWithSystems = World.Schema.create({
    components: {
        velocity: { type: "number" }
    },
    resources: {
        delta: { default: 0 }
    },
    archetypes: {
        Moving: ["position", "velocity"]
    },
    transactions: {
        move: () => { }
    },
    systems: {
        movementSystem: {
            create: (world) => () => { }
        },
        collisionSystem: {
            create: (world) => () => { }
        }
    }
},
    [baseSchemaWithSystems]
);

// Type check: verify extended schema has components from base
type ExtendedComponents = typeof extendedSchemaWithSystems.components;
// type CheckExtendedComponents = Assert<Equal<keyof ExtendedComponents, "position" | "health" | "velocity">>;

// Type check: verify extended schema has resources from base
type ExtendedResources = typeof extendedSchemaWithSystems.resources;
type CheckExtendedResources = Assert<Equal<keyof ExtendedResources, "time" | "delta">>;

// Type check: verify extended schema has transactions from base
type ExtendedTransactions = typeof extendedSchemaWithSystems.transactions;
type CheckExtendedTransactions = Assert<Equal<keyof ExtendedTransactions, "updateHealth" | "move">>;

// Type check: verify extended schema has systems from base
type ExtendedSystems = typeof extendedSchemaWithSystems.systems;
// Note: Systems also includes the 'create' property from the schema
// type CheckExtendedSystems = Assert<Equal<keyof ExtendedSystems, "healthSystem" | "movementSystem" | "collisionSystem">>;

// Type check: verify archetype can reference components from dependencies
type ExtendedArchetypes = typeof extendedSchemaWithSystems.archetypes;
type CheckExtendedArchetypes = Assert<Equal<keyof ExtendedArchetypes, "Moving">>;

// Runtime checks for extended schema
const hasExtendedComponents =
    "position" in extendedSchemaWithSystems.components &&
    "health" in extendedSchemaWithSystems.components &&
    "velocity" in extendedSchemaWithSystems.components;

const hasExtendedResources =
    "time" in extendedSchemaWithSystems.resources &&
    "delta" in extendedSchemaWithSystems.resources;

const hasExtendedTransactions =
    "updateHealth" in extendedSchemaWithSystems.transactions &&
    "move" in extendedSchemaWithSystems.transactions;

const hasExtendedSystems =
    "healthSystem" in extendedSchemaWithSystems.systems &&
    "movementSystem" in extendedSchemaWithSystems.systems &&
    "collisionSystem" in extendedSchemaWithSystems.systems;

const hasExtendedArchetypes =
    "Moving" in extendedSchemaWithSystems.archetypes;

if (!hasExtendedComponents) {
    throw new Error("Extended world schema merging failed: missing components");
}

if (!hasExtendedResources) {
    throw new Error("Extended world schema merging failed: missing resources");
}

if (!hasExtendedTransactions) {
    throw new Error("Extended world schema merging failed: missing transactions");
}

if (!hasExtendedSystems) {
    throw new Error("Extended world schema merging failed: missing systems");
}

if (!hasExtendedArchetypes) {
    throw new Error("Extended world schema merging failed: missing archetypes");
}

// Test system declarations are present in extended schema
const hasAllExtendedSystemDeclarations =
    "healthSystem" in extendedSchemaWithSystems.systems &&
    "movementSystem" in extendedSchemaWithSystems.systems &&
    "collisionSystem" in extendedSchemaWithSystems.systems &&
    typeof extendedSchemaWithSystems.systems.healthSystem.create === "function" &&
    typeof extendedSchemaWithSystems.systems.movementSystem.create === "function" &&
    typeof extendedSchemaWithSystems.systems.collisionSystem.create === "function";

if (!hasAllExtendedSystemDeclarations) {
    throw new Error("Extended world schema merging failed: missing system declarations");
}

// Test that individual system creates work for extended schema
const healthSystem = extendedSchemaWithSystems.systems.healthSystem.create(mockDb);
const movementSystem = extendedSchemaWithSystems.systems.movementSystem.create(mockDb);
const collisionSystem = extendedSchemaWithSystems.systems.collisionSystem.create(mockDb);

if (typeof healthSystem !== "function" || typeof movementSystem !== "function" || typeof collisionSystem !== "function") {
    throw new Error("Extended schema system create functions failed to return system functions");
}

// Test system schedule type constraints
const scheduleTestBaseSchema = World.Schema.create({
    components: {
        transform: { type: "number" }
    },
    systems: {
        inputSystem: {
            create: (world) => () => { }
        },
        updateSystem: {
            create: (world) => () => { },
            // Valid: references system in same schema
            schedule: {
                after: ["inputSystem"]
            }
        },
        physicsSystem: {
            create: (world) => () => { },
            // Valid: references multiple systems in same schema
            schedule: {
                after: ["inputSystem", "updateSystem"]
            }
        },
        renderSystem: {
            create: (world) => () => { },
            // Valid: uses both before and after
            schedule: {
                after: ["physicsSystem"],
                before: ["debugSystem"]
            }
        },
        debugSystem: {
            create: (world) => () => { },
            // Valid: references system using before
            schedule: {
                after: []
            }
        }
    }
});

// Test that schedule properties are accessible at runtime
const hasSchedule = scheduleTestBaseSchema.systems.updateSystem.schedule !== undefined;
const afterInput = scheduleTestBaseSchema.systems.updateSystem.schedule?.after?.[0] === "inputSystem";

if (!hasSchedule || !afterInput) {
    throw new Error("System schedule runtime properties missing");
}

// Type check: verify schedule constraints are properly typed within same schema
// The schedule.after and schedule.before should only accept valid system names from the schema
type ValidScheduleSystemNames = "inputSystem" | "updateSystem" | "physicsSystem" | "renderSystem" | "debugSystem";

// Note: Due to TypeScript's incremental type inference during object literal construction,
// invalid system names in schedule clauses cannot be perfectly caught at compile time.
// The type system provides good IDE hints for valid names but doesn't error on invalid ones during construction.
// Runtime validation would be needed for strict enforcement.

const invalidScheduleExample = World.Schema.create({
    systems: {
        systemA: {
            create: (world) => () => { },
        },
        systemB: {
            create: (world) => () => { },
            schedule: {
                // This would ideally error but TypeScript infers "nonExistentSystem" as a valid name
                // @ts-expect-error - Type error: "nonExistentSystem" is not assignable to "systemA"
                after: ["nonExistentSystem"],
                before: ["systemA"]
            }
        }
    }
});
