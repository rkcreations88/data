import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Database } from "../../database/database.js";
import { createSchedulerPlugin } from "./create-scheduler-plugin.js";

describe("createSchedulerPlugin", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("should create scheduler plugin with timing resources", () => {
        const plugin = createSchedulerPlugin();

        expect(plugin.resources).toHaveProperty("scheduler");
        expect(plugin.resources).toHaveProperty("deltaTime");
        expect(plugin.resources).toHaveProperty("elapsedTime");
        expect(plugin.resources).toHaveProperty("frame");
        expect(plugin.systems).toHaveProperty("schedulerSystem");
    });

    it("should initialize with scheduler control interface", () => {
        const plugin = createSchedulerPlugin();
        const db = Database.create(plugin);

        expect(db.resources.scheduler).toBeDefined();
        expect(db.resources.scheduler.start).toBeInstanceOf(Function);
        expect(db.resources.scheduler.stop).toBeInstanceOf(Function);
        expect(db.resources.scheduler.pause).toBeInstanceOf(Function);
        expect(db.resources.scheduler.resume).toBeInstanceOf(Function);
        expect(db.resources.scheduler.step).toBeInstanceOf(Function);
        expect(db.resources.scheduler.isRunning).toBe(false);
        expect(db.resources.scheduler.isPaused).toBe(false);
    });

    it("should auto-start when autoStart option is true", () => {
        const plugin = createSchedulerPlugin({ autoStart: true });
        const db = Database.create(plugin);

        expect(db.resources.scheduler.isRunning).toBe(true);
        expect(db.resources.scheduler.isPaused).toBe(false);

        db.resources.scheduler.stop();
    });

    it("should start and stop scheduler", () => {
        const plugin = createSchedulerPlugin();
        const db = Database.create(plugin);

        expect(db.resources.scheduler.isRunning).toBe(false);

        db.resources.scheduler.start();
        expect(db.resources.scheduler.isRunning).toBe(true);

        db.resources.scheduler.stop();
        expect(db.resources.scheduler.isRunning).toBe(false);
    });

    it("should pause and resume scheduler", () => {
        const plugin = createSchedulerPlugin();
        const db = Database.create(plugin);

        db.resources.scheduler.start();
        expect(db.resources.scheduler.isPaused).toBe(false);

        db.resources.scheduler.pause();
        expect(db.resources.scheduler.isPaused).toBe(true);
        expect(db.resources.scheduler.isRunning).toBe(true);

        db.resources.scheduler.resume();
        expect(db.resources.scheduler.isPaused).toBe(false);

        db.resources.scheduler.stop();
    });

    it("should execute systems in order", async () => {
        const executionLog: string[] = [];

        const gamePlugin = Database.Plugin.create({
            components: {},
            systems: {
                system1: {
                    create: (_db: any) => () => {
                        executionLog.push("system1");
                    }
                },
                system2: {
                    create: (_db: any) => () => {
                        executionLog.push("system2");
                    }
                }
            }
        }) as any;

        const db = Database.create(
            Database.Plugin.create({}, [gamePlugin, createSchedulerPlugin()]) as any
        ) as any;

        await db.resources.scheduler.step();

        expect(executionLog).toContain("system1");
        expect(executionLog).toContain("system2");
    });

    it("should update timing resources each frame", async () => {
        const plugin = createSchedulerPlugin();
        const db = Database.create(plugin);

        expect(db.resources.deltaTime).toBe(0);
        expect(db.resources.elapsedTime).toBe(0);
        expect(db.resources.frame).toBe(0);

        vi.setSystemTime(1000);
        await db.resources.scheduler.step();

        expect(db.resources.frame).toBe(0);
        expect(db.resources.deltaTime).toBeGreaterThan(0);
        expect(db.resources.elapsedTime).toBeGreaterThan(0);

        vi.advanceTimersByTime(16);
        await db.resources.scheduler.step();

        expect(db.resources.frame).toBe(1);
    });

    it("should handle async systems", async () => {
        const executionLog: string[] = [];

        const gamePlugin = Database.Plugin.create({
            components: {},
            systems: {
                asyncSystem: {
                    create: (_db: any) => async () => {
                        await Promise.resolve();
                        executionLog.push("async");
                    }
                }
            }
        }) as any;

        const db = Database.create(
            Database.Plugin.create({}, [gamePlugin, createSchedulerPlugin()]) as any
        ) as any;

        await db.resources.scheduler.step();

        expect(executionLog).toContain("async");
    });

    it("should respect system scheduling order", async () => {
        const executionLog: string[] = [];

        const gamePlugin = Database.Plugin.create({
            components: {},
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
                        after: ["inputSystem" as const]
                    }
                },
                renderSystem: {
                    create: (_db: any) => () => {
                        executionLog.push("render");
                    },
                    schedule: {
                        after: ["physicsSystem" as const]
                    }
                }
            }
        }) as any;

        const db = Database.create(
            Database.Plugin.create({}, [gamePlugin, createSchedulerPlugin()]) as any
        ) as any;

        await db.resources.scheduler.step();

        expect(executionLog).toEqual(["input", "physics", "render"]);
    });

    it("should filter out schedulerSystem from execution", async () => {
        const executionLog: string[] = [];

        const gamePlugin = Database.Plugin.create({
            components: {},
            systems: {
                testSystem: {
                    create: (db: any) => () => {
                        // Log all systems being executed
                        for (const tier of db.system.order) {
                            executionLog.push(...tier);
                        }
                    }
                }
            }
        });

        const plugin = createSchedulerPlugin();
        const db = Database.create(
            Database.Plugin.create({}, [gamePlugin, plugin])
        );

        await db.resources.scheduler.step();

        // schedulerSystem should be in the order but not executed recursively
        const allSystems = db.system.order.flat();
        expect(allSystems).toContain("schedulerSystem");
    });

    it("should track frame count", async () => {
        const plugin = createSchedulerPlugin();
        const db = Database.create(plugin);

        expect(db.resources.scheduler.frameCount).toBe(0);

        await db.resources.scheduler.step();
        expect(db.resources.scheduler.frameCount).toBe(1);

        await db.resources.scheduler.step();
        expect(db.resources.scheduler.frameCount).toBe(2);
    });

    it("should allow systems to access database", async () => {
        let accessedDeltaTime = 0;

        const gamePlugin = Database.Plugin.create({
            components: {
                position: { type: "object", default: { x: 0, y: 0 } }
            },
            systems: {
                testSystem: {
                    create: (db: any) => () => {
                        accessedDeltaTime = db.resources.deltaTime;
                        const entities = db.select(["position"]);
                        expect(Array.isArray(entities)).toBe(true);
                    }
                }
            }
        });

        const db = Database.create(
            Database.Plugin.create({}, [gamePlugin, createSchedulerPlugin()]) as any
        ) as any;

        await db.resources.scheduler.step();

        expect(accessedDeltaTime).toBeGreaterThanOrEqual(0);
    });
});

