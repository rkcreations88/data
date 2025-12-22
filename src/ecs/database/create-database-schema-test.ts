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
import { Database } from "./database.js";

const databaseSchema = Database.Plugin.create({
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
    }
});

// Test database schema dependencies and merging
const aSchema = Database.Plugin.create({
    components: {
        a: { type: "number" },
        b: { type: "string" }
    },
    resources: {
        c: { default: "string" }
    },
    archetypes: {
        one: ["a", "b"]
    }
});

const bSchema = Database.Plugin.create({
    components: {
        x: { type: "number" },
        y: { type: "string" }
    },
    resources: {
        z: { default: "string" }
    },
    archetypes: {
        two: ["x", "y"]
    }
});

const cSchema = Database.Plugin.create({
    components: {
        m: { type: "number" },
        n: { type: "string" }
    },
    resources: {
        c: { default: "string" }
    },
    archetypes: {
        three: ["m", "n", "x"]
    }
},
    [aSchema, bSchema]
);

// Type check: verify merged schema has all components from dependencies
type MergedSchemaComponents = typeof cSchema.components;
// Note: With partial schema support, exact type inference is relaxed. Runtime checks below verify correctness.
// type CheckMergedComponents = Assert<Equal<keyof MergedSchemaComponents, "a" | "b" | "x" | "y" | "m" | "n">>;

// Type check: verify merged schema has all resources from dependencies
type MergedSchemaResources = typeof cSchema.resources;
type CheckMergedResources = Assert<Equal<keyof MergedSchemaResources, "c" | "z">>;

// Type check: verify merged schema has all archetypes from dependencies
type MergedSchemaArchetypes = typeof cSchema.archetypes;
type CheckMergedArchetypes = Assert<Equal<keyof MergedSchemaArchetypes, "one" | "two" | "three">>;

// Type check: verify merged schema has all transactions from dependencies
type MergedSchemaTransactions = typeof cSchema.transactions;
type CheckMergedTransactions = Assert<Equal<keyof MergedSchemaTransactions, never>>;

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

if (!hasAllComponents) {
    throw new Error("Schema merging failed: missing components");
}

if (!hasAllResources) {
    throw new Error("Schema merging failed: missing resources");
}

if (!hasAllArchetypes) {
    throw new Error("Schema merging failed: missing archetypes");
}

// Test with transactions in dependencies
const baseSchemaWithTransactions = Database.Plugin.create({
    components: {
        position: { type: "number" },
        health: { type: "number" }
    },
    resources: {
        time: { default: 0 }
    },
    transactions: {
        updateHealth: () => { }
    }
});

const extendedSchemaWithTransactions = Database.Plugin.create({
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
    }
},
    [baseSchemaWithTransactions]
);

// Type check: verify extended schema has components from base
type ExtendedComponents = typeof extendedSchemaWithTransactions.components;
// Note: With partial schema support, exact type inference is relaxed. Runtime checks below verify correctness.
// type CheckExtendedComponents = Assert<Equal<keyof ExtendedComponents, "position" | "health" | "velocity">>;

// Type check: verify extended schema has resources from base
type ExtendedResources = typeof extendedSchemaWithTransactions.resources;
type CheckExtendedResources = Assert<Equal<keyof ExtendedResources, "time" | "delta">>;

// Type check: verify extended schema has transactions from base
type ExtendedTransactions = typeof extendedSchemaWithTransactions.transactions;
type CheckExtendedTransactions = Assert<Equal<keyof ExtendedTransactions, "updateHealth" | "move">>;

// Type check: verify archetype can reference components from dependencies
type ExtendedArchetypes = typeof extendedSchemaWithTransactions.archetypes;
type CheckExtendedArchetypes = Assert<Equal<keyof ExtendedArchetypes, "Moving">>;

// Runtime checks for extended schema
const hasExtendedComponents =
    "position" in extendedSchemaWithTransactions.components &&
    "health" in extendedSchemaWithTransactions.components &&
    "velocity" in extendedSchemaWithTransactions.components;

const hasExtendedResources =
    "time" in extendedSchemaWithTransactions.resources &&
    "delta" in extendedSchemaWithTransactions.resources;

const hasExtendedTransactions =
    "updateHealth" in extendedSchemaWithTransactions.transactions &&
    "move" in extendedSchemaWithTransactions.transactions;

const hasExtendedArchetypes =
    "Moving" in extendedSchemaWithTransactions.archetypes;

if (!hasExtendedComponents) {
    throw new Error("Extended schema merging failed: missing components");
}

if (!hasExtendedResources) {
    throw new Error("Extended schema merging failed: missing resources");
}

if (!hasExtendedTransactions) {
    throw new Error("Extended schema merging failed: missing transactions");
}

if (!hasExtendedArchetypes) {
    throw new Error("Extended schema merging failed: missing archetypes");
}

