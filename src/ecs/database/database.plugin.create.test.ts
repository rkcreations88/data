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
import { Database } from "./database.js";
import { Vec3 } from "../../math/index.js";

describe("Database.Plugin.create", () => {

    describe("type inference", () => {

        it("should infer db type correctly with 1 args", () => {
            const plugin = Database.Plugin.create(
                {
                    resources: {
                        time: { default: 0 as number },
                    },
                    systems: {
                        physicsSystem: {
                            create: (db) => () => {
                                const time: number = db.resources.time;
                                // @ts-expect-error - this should be an error
                                const dt: number = db.resources.deltaTime2;
                            },
                        }
                    }
                },
            );

            expect(plugin).toBeDefined();
            expect(plugin.components).toBeDefined();
            expect(plugin.resources).toBeDefined();
            expect(plugin.systems).toBeDefined();
        });
        it("should infer db type correctly with 2 args", () => {
            const plugin = Database.Plugin.create(
                {
                    resources: {
                        time: { default: 0 as number },
                    },
                    systems: {
                        firstSystem: {
                            create: (db) => () => {
                                const time: number = db.resources.time;
                                // @ts-expect-error - this should be an error
                                const dt: number = db.resources.deltaTime2;
                            }
                        }
                    }
                },
                {
                    systems: {
                        physicsSystem: {
                            create: (db) => () => {
                                const time: number = db.resources.time;
                                // @ts-expect-error - this should be an error
                                const dt: number = db.resources.deltaTime2;
                            },
                            // schedule: {
                            //     after: ["firstSystem2"]
                            // }
                        }
                    }
                },
            );

            expect(plugin).toBeDefined();
            expect(plugin.components).toBeDefined();
            expect(plugin.resources).toBeDefined();
            expect(plugin.systems).toBeDefined();
        });

        it("should infer db type correctly with 3 args", () => {
            const plugin = Database.Plugin.create(
                {
                    resources: {
                        time: { default: 0 as number },
                    },
                },
                {},
                {
                    systems: {
                        physicsSystem: {
                            create: (db) => () => {
                                const time: number = db.resources.time;
                                // @ts-expect-error - deltaTime is not defined in resources
                                const dt: number = db.resources.deltaTime;
                            }
                        }
                    }
                },
            );

            expect(plugin).toBeDefined();
            expect(plugin.components).toBeDefined();
            expect(plugin.resources).toBeDefined();
            expect(plugin.systems).toBeDefined();
        });

        it("should infer db type correctly with 4 args", () => {
            const plugin = Database.Plugin.create(
                {
                    components: {
                        position: Vec3.schema,
                    },
                    resources: {
                        time: { default: 0 as number },
                    },
                },
                {},
                {},
                {
                    systems: {
                        physicsSystem: {
                            create: (db) => () => {
                                const entities = db.select(["position"]);
                                const time: number = db.resources.time;
                            }
                        }
                    }
                },
            );

            expect(plugin).toBeDefined();
            expect(plugin.components).toBeDefined();
            expect(plugin.resources).toBeDefined();
            expect(plugin.systems).toBeDefined();
        });
    });

    describe("basic plugin creation", () => {
        it("should create plugin with components, resources, and archetypes", () => {
            const plugin = Database.Plugin.create({
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

            expect(plugin.components).toBeDefined();
            expect("velocity" in plugin.components).toBe(true);
            expect("particle" in plugin.components).toBe(true);
            expect(plugin.resources).toBeDefined();
            expect("mousePosition" in plugin.resources).toBe(true);
            expect("fooPosition" in plugin.resources).toBe(true);
            expect(plugin.archetypes).toBeDefined();
            expect("Particle" in plugin.archetypes).toBe(true);
            expect("DynamicParticle" in plugin.archetypes).toBe(true);
        });
    });

    describe("schema merging", () => {
        it("should merge multiple plugins with components, resources, and archetypes", () => {
            const aPlugin = Database.Plugin.create({
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

            const bPlugin = Database.Plugin.create({
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

            const mergedPlugin = Database.Plugin.create(aPlugin, bPlugin, {
                components: {
                    m: { type: "number" },
                    n: { type: "string" }
                },
                resources: {
                    c: { default: "string" } // Override resource c
                },
                archetypes: {
                    three: ["m", "n", "x"]
                }
            });

            // Verify all components from all plugins are present
            expect("a" in mergedPlugin.components).toBe(true);
            expect("b" in mergedPlugin.components).toBe(true);
            expect("x" in mergedPlugin.components).toBe(true);
            expect("y" in mergedPlugin.components).toBe(true);
            expect("m" in mergedPlugin.components).toBe(true);
            expect("n" in mergedPlugin.components).toBe(true);

            // Verify all resources are present
            expect("c" in mergedPlugin.resources).toBe(true);
            expect("z" in mergedPlugin.resources).toBe(true);

            // Verify all archetypes are present
            expect("one" in mergedPlugin.archetypes).toBe(true);
            expect("two" in mergedPlugin.archetypes).toBe(true);
            expect("three" in mergedPlugin.archetypes).toBe(true);
        });

        it("should merge plugins with transactions", () => {
            const basePlugin = Database.Plugin.create({
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

            const extendedPlugin = Database.Plugin.create(basePlugin, {
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
            });

            // Verify components from both plugins
            expect("position" in extendedPlugin.components).toBe(true);
            expect("health" in extendedPlugin.components).toBe(true);
            expect("velocity" in extendedPlugin.components).toBe(true);

            // Verify resources from both plugins
            expect("time" in extendedPlugin.resources).toBe(true);
            expect("delta" in extendedPlugin.resources).toBe(true);

            // Verify transactions from both plugins
            expect("updateHealth" in extendedPlugin.transactions).toBe(true);
            expect("move" in extendedPlugin.transactions).toBe(true);

            // Verify archetypes
            expect("Moving" in extendedPlugin.archetypes).toBe(true);
        });
    });

    describe("systems", () => {
        it("should create empty database with no systems", () => {
            const db = Database.create();

            expect(db.system.functions).toEqual({});
            expect(db.system.order).toEqual([]);
        });

        it("should create database from plugin with systems", () => {
            const executionLog: string[] = [];

            const plugin = Database.Plugin.create({
                components: {
                    position: { type: "object", default: { x: 0, y: 0, z: 0 } }
                }
            }, {
                systems: {
                    updateSystem: {
                        create: (_db) => () => {
                            executionLog.push("update");
                        }
                    },
                    renderSystem: {
                        create: (_db) => () => {
                            executionLog.push("render");
                        }
                    }
                }
            });

            const db = Database.create(plugin);

            expect(db.system.functions.updateSystem).toBeDefined();
            expect(db.system.functions.renderSystem).toBeDefined();
            expect(db.system.order).toHaveLength(1);
            expect(db.system.order[0]).toHaveLength(2);

            // Execute systems
            db.system.functions.updateSystem();
            db.system.functions.renderSystem();

            expect(executionLog).toEqual(["update", "render"]);
        });

        it("should respect system scheduling dependencies", () => {
            const executionLog: string[] = [];

            const plugin = Database.Plugin.create({
                components: {
                    position: { type: "object", default: { x: 0, y: 0, z: 0 } }
                },
                systems: {
                    inputSystem: {
                        create: (_db) => () => {
                            executionLog.push("input");
                        }
                    },
                    physicsSystem: {
                        create: (_db) => () => {
                            executionLog.push("physics");
                        },
                        schedule: {
                            after: ["inputSystem"]
                        }
                    },
                    renderSystem: {
                        create: (_db) => () => {
                            executionLog.push("render");
                        },
                        schedule: {
                            after: ["physicsSystem"]
                        }
                    }
                }
            });

            const db = Database.create(plugin);

            // Should have 3 tiers: input -> physics -> render
            expect(db.system.order).toHaveLength(3);
            expect(db.system.order[0]).toEqual(["inputSystem"]);
            expect(db.system.order[1]).toEqual(["physicsSystem"]);
            expect(db.system.order[2]).toEqual(["renderSystem"]);

            // Execute in order
            for (const tier of db.system.order) {
                for (const systemName of tier) {
                    db.system.functions[systemName]();
                }
            }

            expect(executionLog).toEqual(["input", "physics", "render"]);
        });

        it("should support parallel system execution in same tier", () => {
            const plugin = Database.Plugin.create({
                components: {},
                archetypes: {},
                systems: {
                    system1: {
                        create: (_db) => () => { }
                    },
                    system2: {
                        create: (_db) => () => { }
                    },
                    system3: {
                        create: (_db) => () => { }
                    }
                }
            });

            const db = Database.create(plugin);

            // All independent systems should be in one tier
            expect(db.system.order).toHaveLength(1);
            expect(db.system.order[0]).toHaveLength(3);
        });

        it("should support async systems", async () => {
            const executionLog: string[] = [];

            const plugin = Database.Plugin.create({
                components: {},
                archetypes: {},
                systems: {
                    asyncSystem: {
                        create: (_db) => async () => {
                            await new Promise(resolve => setTimeout(resolve, 10));
                            executionLog.push("async");
                        }
                    }
                }
            });

            const db = Database.create(plugin);

            await db.system.functions.asyncSystem();
            expect(executionLog).toEqual(["async"]);
        });
    });

    describe("plugin composition", () => {
        it("should support plugin composition through dependencies", () => {
            const executionLog: string[] = [];

            const inputPlugin = Database.Plugin.create({
                components: {},
                systems: {
                    inputSystem: {
                        create: (_db) => () => {
                            executionLog.push("input");
                        }
                    }
                }
            });

            const physicsPlugin = Database.Plugin.create(inputPlugin, {
                components: {
                    velocity: { type: "object", default: { x: 0, y: 0, z: 0 } }
                }
            }, {
                systems: {
                    physicsSystem: {
                        create: (_db) => () => {
                            executionLog.push("physics");
                        },
                        schedule: {
                            after: ["inputSystem"]
                        }
                    }
                }
            });

            const db = Database.create(physicsPlugin);

            // Should have both systems
            expect(db.system.functions.inputSystem).toBeDefined();
            expect(db.system.functions.physicsSystem).toBeDefined();

            // Execute in order
            for (const tier of db.system.order) {
                for (const systemName of tier) {
                    db.system.functions[systemName]();
                }
            }

            expect(executionLog).toEqual(["input", "physics"]);
        });
    });

    describe("database extension", () => {
        it("should extend database with new systems", () => {
            const executionLog: string[] = [];

            const basePlugin = Database.Plugin.create({
                components: {
                    position: { type: "object", default: { x: 0, y: 0, z: 0 } }
                },
                systems: {
                    updateSystem: {
                        create: (_db) => () => {
                            executionLog.push("update");
                        }
                    }
                }
            });

            const extensionPlugin = Database.Plugin.create({
                components: {
                    velocity: { type: "object", default: { x: 0, y: 0, z: 0 } }
                },
                systems: {
                    physicsSystem: {
                        create: (_db) => () => {
                            executionLog.push("physics");
                        }
                    }
                }
            });

            const db = Database.create(basePlugin);
            const extended = db.extend(extensionPlugin);

            expect(extended.system.functions.updateSystem).toBeDefined();
            expect(extended.system.functions.physicsSystem).toBeDefined();

            // Both systems should be available
            extended.system.functions.updateSystem();
            extended.system.functions.physicsSystem();

            expect(executionLog).toEqual(["update", "physics"]);
        });

        it("should maintain system order when extending", () => {
            const basePlugin = Database.Plugin.create({
                components: {},
                archetypes: {},
                systems: {
                    system1: {
                        create: (_db) => () => { }
                    }
                }
            });

            const extensionPlugin = Database.Plugin.create({
                components: {},
                archetypes: {},
                systems: {
                    system2: {
                        create: (_db) => () => { },
                        schedule: {
                            after: ["system1"]
                        }
                    }
                }
            });

            const db = Database.create(basePlugin);
            const extended = db.extend(extensionPlugin);

            // system2 should be scheduled after system1
            expect(extended.system.order).toHaveLength(2);
            expect(extended.system.order[0]).toEqual(["system1"]);
            expect(extended.system.order[1]).toEqual(["system2"]);
        });

        it("should extend database without systems and return same instance", () => {
            const plugin = Database.Plugin.create({
                components: {
                    position: { type: "object", default: { x: 0, y: 0, z: 0 } }
                }
            });

            const extensionPlugin = Database.Plugin.create({
                components: {
                    velocity: { type: "object", default: { x: 0, y: 0, z: 0 } }
                }
            });

            const db = Database.create(plugin);
            const extended = db.extend(extensionPlugin);

            // When no systems involved, should return same instance
            expect(extended).toBe(db);
        });

        it("should create new database instance when extending with systems", () => {
            const basePlugin = Database.Plugin.create({
                components: {
                    position: { type: "object", default: { x: 0, y: 0, z: 0 } }
                },
                systems: {
                    system1: {
                        create: (_db) => () => { }
                    }
                }
            });

            const extensionPlugin = Database.Plugin.create({
                components: {},
                systems: {
                    system2: {
                        create: (_db) => () => { }
                    }
                }
            });

            const db = Database.create(basePlugin);
            const extended = db.extend(extensionPlugin);

            // When systems are involved, should create new instance
            expect(extended).not.toBe(db);
        });
    });
});

