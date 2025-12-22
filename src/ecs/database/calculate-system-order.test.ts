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

import { assert } from "riteway/vitest";
import { describe, test, expect } from "vitest";
import { calculateSystemOrder } from "./calculate-system-order.js";

describe("calculateSystemOrder", () => {

    test("empty systems object", async () => {
        const systems = {};
        const actual = calculateSystemOrder(systems);
        const expected: string[][] = [];
        await assert({
            given: "empty systems object",
            should: "return empty order array",
            actual,
            expected,
        });
    });

    test("single system with no constraints", async () => {
        const systems = {
            renderSystem: { create: () => () => { } },
        };
        const actual = calculateSystemOrder(systems);
        const expected = [["renderSystem"]];
        await assert({
            given: "single system with no constraints",
            should: "return single tier with that system",
            actual,
            expected,
        });
    });

    test("multiple systems with no constraints", async () => {
        const systems = {
            inputSystem: { create: () => () => { } },
            physicsSystem: { create: () => () => { } },
            renderSystem: { create: () => () => { } },
        };
        const actual = calculateSystemOrder(systems);
        const expected = [["inputSystem", "physicsSystem", "renderSystem"]];
        await assert({
            given: "multiple systems with no constraints",
            should: "return single tier with all systems in parallel",
            actual,
            expected,
        });
    });

    test("render system scheduled after physics", async () => {
        const systems = {
            physicsSystem: { create: () => () => { } },
            renderSystem: {
                create: () => () => { },
                schedule: { after: ["physicsSystem"] }
            },
        };
        const actual = calculateSystemOrder(systems);
        const expected = [["physicsSystem"], ["renderSystem"]];
        await assert({
            given: "render system scheduled after physics",
            should: "return physics in first tier, render in second",
            actual,
            expected,
        });
    });

    test("physics system scheduled before render", async () => {
        const systems = {
            physicsSystem: {
                create: () => () => { },
                schedule: { before: ["renderSystem"] }
            },
            renderSystem: { create: () => () => { } },
        };
        const actual = calculateSystemOrder(systems);
        const expected = [["physicsSystem"], ["renderSystem"]];
        await assert({
            given: "physics system scheduled before render",
            should: "return physics in first tier, render in second",
            actual,
            expected,
        });
    });

    test("complex dependency graph with parallel systems", async () => {
        const systems = {
            inputSystem: { create: () => () => { } },
            physicsSystem: {
                create: () => () => { },
                schedule: { after: ["inputSystem"] }
            },
            aiSystem: {
                create: () => () => { },
                schedule: { after: ["inputSystem"] }
            },
            renderSystem: {
                create: () => () => { },
                schedule: { after: ["physicsSystem", "aiSystem"] }
            },
        };
        const actual = calculateSystemOrder(systems);
        const expected = [
            ["inputSystem"],
            ["aiSystem", "physicsSystem"],
            ["renderSystem"]
        ];
        await assert({
            given: "complex dependency graph with parallel systems",
            should: "return correct multi-tier execution order with alphabetical sorting within tiers",
            actual,
            expected,
        });
    });

    test("greedy scheduling with mixed independent and dependent systems", async () => {
        const systems = {
            systemA: { create: () => () => { } },  // No dependencies
            systemB: {
                create: () => () => { },
                schedule: { after: ["systemA"] }  // Depends on A
            },
            systemC: { create: () => () => { } },  // Independent! Should run in tier 0
            systemD: {
                create: () => () => { },
                schedule: { after: ["systemB"] }  // Depends on B
            },
        };
        const actual = calculateSystemOrder(systems);
        const expected = [
            ["systemA", "systemC"],  // Both independent, run together ASAP
            ["systemB"],              // Runs after A
            ["systemD"]               // Runs after B
        ];
        await assert({
            given: "mixed independent and dependent systems",
            should: "schedule independent systems in earliest tier (greedy scheduling)",
            actual,
            expected,
        });
    });

    test("circular dependency between systems", () => {
        const systems = {
            systemA: {
                create: () => () => { },
                schedule: { after: ["systemB"] }
            },
            systemB: {
                create: () => () => { },
                schedule: { after: ["systemA"] }
            },
        };
        expect(() => calculateSystemOrder(systems)).toThrow("Circular dependency detected in system scheduling");
    });

});

