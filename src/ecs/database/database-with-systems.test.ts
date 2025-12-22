import { describe, it, expect } from "vitest";
import { Database } from "./database.js";

describe("Database with systems", () => {
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
            },
            systems: {
                updateSystem: {
                    create: (_db: any) => () => {
                        executionLog.push("update");
                    }
                },
                renderSystem: {
                    create: (_db: any) => () => {
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
                    create: (_db: any) => () => {
                        executionLog.push("input");
                    }
                },
                physicsSystem: {
                    create: (_db: any) => () => {
                        executionLog.push("physics");
                    },
                    schedule: {
                        after: ["inputSystem"]
                    }
                },
                renderSystem: {
                    create: (_db: any) => () => {
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
            systems: {
                system1: {
                    create: (_db: any) => () => { }
                },
                system2: {
                    create: (_db: any) => () => { }
                },
                system3: {
                    create: (_db: any) => () => { }
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
            systems: {
                asyncSystem: {
                    create: (_db: any) => async () => {
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

    it("should allow systems to access database", () => {
        const plugin = Database.Plugin.create({
            components: {
                position: { type: "object", default: { x: 0, y: 0, z: 0 } }
            },
            resources: {
                time: { default: 0 }
            },
            archetypes: {
                Entity: ["position"]
            },
            systems: {
                updateSystem: {
                    create: (db: any) => () => {
                        // System can access database
                        const entities = db.select(["position"]);
                        expect(Array.isArray(entities)).toBe(true);
                        expect(db.resources.time).toBe(0);
                    }
                }
            }
        });

        const db = Database.create(plugin);
        db.system.functions.updateSystem();
    });

    it("should extend database with new systems", () => {
        const executionLog: string[] = [];

        const basePlugin = Database.Plugin.create({
            components: {
                position: { type: "object", default: { x: 0, y: 0, z: 0 } }
            },
            systems: {
                updateSystem: {
                    create: (_db: any) => () => {
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
                    create: (_db: any) => () => {
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
            systems: {
                system1: {
                    create: (_db: any) => () => { }
                }
            }
        });

        const extensionPlugin = Database.Plugin.create({
            components: {},
            systems: {
                system2: {
                    create: (_db: any) => () => { },
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
                    create: (_db: any) => () => { }
                }
            }
        });

        const extensionPlugin = Database.Plugin.create({
            components: {},
            systems: {
                system2: {
                    create: (_db: any) => () => { }
                }
            }
        });

        const db = Database.create(basePlugin);
        const extended = db.extend(extensionPlugin);

        // When systems are involved, should create new instance
        expect(extended).not.toBe(db);
    });

    it("should support plugin composition through dependencies", () => {
        const executionLog: string[] = [];

        const inputPlugin = Database.Plugin.create({
            components: {},
            systems: {
                inputSystem: {
                    create: (_db: any) => () => {
                        executionLog.push("input");
                    }
                }
            }
        });

        const physicsPlugin = Database.Plugin.create({
            components: {
                velocity: { type: "object", default: { x: 0, y: 0, z: 0 } }
            },
            systems: {
                physicsSystem: {
                    create: (_db: any) => () => {
                        executionLog.push("physics");
                    },
                    schedule: {
                        after: ["inputSystem"]
                    }
                }
            }
        }, [inputPlugin]);

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

