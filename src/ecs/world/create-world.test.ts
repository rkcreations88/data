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
import { createWorld } from "./create-world.js";
import { World } from "./world.js";
import { Database } from "../database/database.js";

describe("createWorld", () => {

    test("empty world creation", async () => {
        const world = createWorld();

        await assert({
            given: "no arguments",
            should: "create empty world with database",
            actual: typeof world.database,
            expected: "object",
        });

        await assert({
            given: "no arguments",
            should: "create empty world with system object",
            actual: typeof world.system,
            expected: "object",
        });

        await assert({
            given: "no arguments",
            should: "have empty system functions",
            actual: Object.keys(world.system.functions).length,
            expected: 0,
        });

        await assert({
            given: "no arguments",
            should: "have empty system order",
            actual: world.system.order.length,
            expected: 0,
        });
    });

    test("world from schema with systems", async () => {
        let systemExecuted = false;

        const schema = World.Schema.create({
            components: {
                position: { type: "object", default: { x: 0, y: 0, z: 0 } }
            },
            resources: {
                time: { default: { delta: 0, elapsed: 0 } }
            },
            systems: {
                updateSystem: {
                    create: (world) => () => {
                        systemExecuted = true;
                    }
                }
            }
        });

        const world = createWorld(schema);

        await assert({
            given: "world schema with one system",
            should: "have system function available",
            actual: typeof world.system.functions.updateSystem,
            expected: "function",
        });

        await assert({
            given: "world schema with one system",
            should: "have system in order array",
            actual: world.system.order,
            expected: [["updateSystem"]],
        });

        // Execute the system
        world.system.functions.updateSystem();

        await assert({
            given: "system execution",
            should: "execute the system function",
            actual: systemExecuted,
            expected: true,
        });
    });

    test("world with multiple systems and dependencies", async () => {
        const executionOrder: string[] = [];

        const schema = World.Schema.create({
            systems: {
                inputSystem: {
                    create: (world) => () => {
                        executionOrder.push("input");
                    }
                },
                physicsSystem: {
                    create: (world) => () => {
                        executionOrder.push("physics");
                    },
                    schedule: { after: ["inputSystem"] }
                },
                renderSystem: {
                    create: (world) => () => {
                        executionOrder.push("render");
                    },
                    schedule: { after: ["physicsSystem"] }
                }
            }
        });

        const world = createWorld(schema);

        await assert({
            given: "systems with dependencies",
            should: "calculate correct execution order",
            actual: world.system.order,
            expected: [["inputSystem"], ["physicsSystem"], ["renderSystem"]],
        });

        // Execute systems in order
        for (const tier of world.system.order) {
            for (const systemName of tier) {
                world.system.functions[systemName]();
            }
        }

        await assert({
            given: "systems executed in order",
            should: "run in correct sequence",
            actual: executionOrder,
            expected: ["input", "physics", "render"],
        });
    });

    test("systems can access database", async () => {
        let capturedDatabase: any = null;

        const schema = World.Schema.create({
            components: {
                position: { type: "object", default: { x: 0, y: 0, z: 0 } }
            },
            systems: {
                testSystem: {
                    create: (world) => {
                        capturedDatabase = world.database;
                        return () => { };
                    }
                }
            }
        });

        const world = createWorld(schema);

        await assert({
            given: "system created with database",
            should: "receive database instance",
            actual: capturedDatabase === world.database,
            expected: true,
        });
    });

    test("world extend with new systems", async () => {
        const baseSchema = World.Schema.create({
            systems: {
                systemA: {
                    create: (world) => () => { }
                }
            }
        });

        const extensionSchema = World.Schema.create({
            systems: {
                systemB: {
                    create: (world) => () => { }
                }
            }
        });

        const world = createWorld(baseSchema);
        const extendedWorld = world.extend(extensionSchema);

        await assert({
            given: "world extended with new system",
            should: "have both systems available",
            actual: Object.keys(extendedWorld.system.functions).sort(),
            expected: ["systemA", "systemB"],
        });

        await assert({
            given: "world extended with new system",
            should: "update system order",
            actual: extendedWorld.system.order,
            expected: [["systemA", "systemB"]],
        });
    });

    test("world extend with components and resources", async () => {
        const baseSchema = World.Schema.create({
            components: {
                position: { type: "object", default: { x: 0, y: 0, z: 0 } }
            },
            systems: {
                systemA: {
                    create: (world) => () => {
                        // Can access position component
                        const entities = world.database.select(["position"]);
                    }
                }
            }
        });

        const extensionSchema = World.Schema.create({
            components: {
                velocity: { type: "object", default: { x: 0, y: 0, z: 0 } }
            },
            systems: {
                systemB: {
                    create: (world) => () => {
                        // Can access velocity component
                        const entities = world.database.select(["velocity"]);
                    }
                }
            }
        });

        const world = createWorld(baseSchema);
        const extendedWorld = world.extend(extensionSchema);

        // Create entity with both components
        const archetype = extendedWorld.database.store.ensureArchetype(["id", "position", "velocity"]);
        archetype.insert({
            position: { x: 1, y: 2, z: 3 },
            velocity: { x: 0.1, y: 0.2, z: 0.3 }
        });

        await assert({
            given: "world extended with components",
            should: "have both systems available",
            actual: Object.keys(extendedWorld.system.functions).sort(),
            expected: ["systemA", "systemB"],
        });
    });

    test("world with async system", async () => {
        let asyncExecuted = false;

        const schema = World.Schema.create({
            systems: {
                asyncSystem: {
                    create: (world) => async () => {
                        await new Promise(resolve => setTimeout(resolve, 1));
                        asyncExecuted = true;
                    }
                }
            }
        });

        const world = createWorld(schema);
        await world.system.functions.asyncSystem();

        await assert({
            given: "async system execution",
            should: "complete async operations",
            actual: asyncExecuted,
            expected: true,
        });
    });

    test("world with parallel systems execution", async () => {
        const executionLog: string[] = [];

        const schema = World.Schema.create({
            systems: {
                system1: {
                    create: (world) => () => {
                        executionLog.push("system1-start");
                        executionLog.push("system1-end");
                    }
                },
                system2: {
                    create: (world) => () => {
                        executionLog.push("system2-start");
                        executionLog.push("system2-end");
                    }
                },
                system3: {
                    create: (world) => () => {
                        executionLog.push("system3-start");
                        executionLog.push("system3-end");
                    },
                    schedule: { after: ["system1", "system2"] }
                }
            }
        });

        const world = createWorld(schema);

        await assert({
            given: "systems with parallel execution capability",
            should: "group independent systems in same tier",
            actual: world.system.order[0]?.length ?? 0,
            expected: 2,
        });

        await assert({
            given: "systems with parallel execution capability",
            should: "place dependent system in later tier",
            actual: world.system.order[1],
            expected: ["system3"],
        });
    });

});

