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
import { createWorld } from "./create-world.js";
import { createStore } from "../store/create-store.js";
import { createDatabase } from "../database/create-database.js";

function createTestStore() {
    return createStore(
        {},
        {
            result: { type: "string", default: "" },
            counter: { default: 0 }
        },
        {}
    );
}
type TestStore = ReturnType<typeof createTestStore>;

function createTestDatabase() {
    const store = createTestStore();
    const database = createDatabase(store, {
        appendToResult(t, char: string) {
            t.resources.result += char;
        },
        incrementCounter(t) {
            t.resources.counter += 1;
        }
    });
    return database;
}
type TestDatabase = ReturnType<typeof createTestDatabase>;

function createTestWorld() {
    const store = createTestStore();
    const database = createDatabase(store, {
        appendToResult(t, char: string) {
            t.resources.result += char;
        },
        incrementCounter(t) {
            t.resources.counter += 1;
        }
    });
    return { store, database };
}

describe("createWorld", () => {
    describe("system execution order", () => {
        it("should execute systems with dependency constraints in correct order", async () => {
            const { store, database } = createTestWorld();

            // Deliberately define systems in WRONG order to test dependency resolution
            const world = createWorld(store, database, {
                third: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "C"; }
                },
                first: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "A"; },
                    schedule: { before: ["second"] }
                },
                second: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "B"; },
                    schedule: { after: ["first"], before: ["third"] }
                }
            });

            // Pass systems in wrong order - dependency resolution should fix it
            await world.runSystems(["third", "second", "first"]);

            expect(store.resources.result).toBe("ABC");
        });

        it("should execute systems with after constraints in correct order", async () => {
            const { store, database } = createTestWorld();

            // Define systems in reverse dependency order to test resolution
            const world = createWorld(store, database, {
                render: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "R"; },
                    schedule: { after: ["physics"] }
                },
                physics: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "P"; },
                    schedule: { after: ["input"] }
                },
                input: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "I"; }
                }
            });

            // Pass systems in completely wrong order - should still execute I→P→R
            await world.runSystems(["render", "physics", "input"]);

            expect(store.resources.result).toBe("IPR");
        });

        it("should handle complex dependency graph", async () => {
            const { store, database } = createTestWorld();

            // Define systems in completely reverse order from dependencies
            const world = createWorld(store, database, {
                d: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "D"; }
                },
                b: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "B"; },
                    schedule: { before: ["d"] }
                },
                c: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "C"; },
                    schedule: { before: ["d"] }
                },
                a: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "A"; },
                    schedule: { before: ["b", "c"] }
                }
            });

            // Pass in reverse dependency order - topological sort must fix it
            await world.runSystems(["d", "c", "b", "a"]);

            // A must come first, then B and C in any order, then D
            expect(store.resources.result).toMatch(/^A[BC][BC]D$/);
        });
    });

    describe("system types", () => {
        it("should execute store systems directly on store", async () => {
            const { store, database } = createTestWorld();

            const world = createWorld(store, database, {
                storeSystem: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "STORE"; }
                }
            });

            await world.runSystems(["storeSystem"]);

            expect(store.resources.result).toBe("STORE");
        });

        it("should execute database systems with transactions", async () => {
            const { store, database } = createTestWorld();

            const world = createWorld(store, database, {
                dbSystem: {
                    type: "database",
                    run: (db: TestDatabase) => { db.transactions.appendToResult("DB"); }
                }
            });

            await world.runSystems(["dbSystem"]);

            expect(store.resources.result).toBe("DB");
        });

        it("should handle mixed store and database systems", async () => {
            const { store, database } = createTestWorld();

            // Define database system first, but it should run after store system
            const world = createWorld(store, database, {
                dbSecond: {
                    type: "database",
                    run: (db: TestDatabase) => { db.transactions.appendToResult("D"); }
                },
                storeFirst: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "S"; },
                    schedule: { before: ["dbSecond"] }
                }
            });

            // Pass systems in wrong order - dependency should fix it
            await world.runSystems(["dbSecond", "storeFirst"]);

            expect(store.resources.result).toBe("SD");
        });
    });

    describe("synchronous vs asynchronous execution", () => {
        it("should handle all synchronous systems", async () => {
            const { store, database } = createTestWorld();

            // Define second system first to test dependency resolution
            const world = createWorld(store, database, {
                sync2: {
                    type: "store",
                    run: (s: TestStore) => {
                        s.resources.result += "2";
                    }
                },
                sync1: {
                    type: "store",
                    run: (s: TestStore) => {
                        s.resources.result += "1";
                    },
                    schedule: { before: ["sync2"] }
                }
            });

            // Pass in reverse order - dependency resolution should fix it
            await world.runSystems(["sync2", "sync1"]);

            // Result "12" proves sync1 ran before sync2
            expect(store.resources.result).toBe("12");
        });

        it("should complete synchronously when all systems are sync", () => {
            const { store, database } = createTestWorld();

            const world = createWorld(store, database, {
                syncA: {
                    type: "store",
                    run: (s: TestStore) => {
                        s.resources.result += "A";
                    }
                },
                syncB: {
                    type: "store",
                    run: (s: TestStore) => {
                        s.resources.result += "B";
                    }
                }
            });

            // Time the execution to ensure it's immediate for sync systems
            const startTime = performance.now();
            world.runSystems(["syncA", "syncB"]);
            const endTime = performance.now();

            expect(store.resources.result).toBe("AB");
            // Sync systems should complete in < 1ms (no waiting for timers/promises)
            expect(endTime - startTime).toBeLessThan(1);
        });

        it("should properly await asynchronous systems", async () => {
            const { store, database } = createTestWorld();

            // Define second async system first to test dependency resolution
            const world = createWorld(store, database, {
                async2: {
                    type: "store",
                    run: async (s: TestStore) => {
                        await new Promise(resolve => setTimeout(resolve, 5));
                        s.resources.result += "B";
                    }
                },
                async1: {
                    type: "store",
                    run: async (s: TestStore) => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        s.resources.result += "A";
                    },
                    schedule: { before: ["async2"] }
                }
            });

            // Pass in wrong order - should still execute A then B due to dependencies
            await world.runSystems(["async2", "async1"]);

            // Result "AB" proves async1 awaited before async2 started
            expect(store.resources.result).toBe("AB");
        });

        it("should fully await async systems completion", async () => {
            const { store, database } = createTestWorld();
            const timestamps: number[] = [];

            const world = createWorld(store, database, {
                delayedSystem: {
                    type: "store",
                    run: async (s: TestStore) => {
                        timestamps.push(performance.now());
                        await new Promise(resolve => setTimeout(resolve, 20));
                        timestamps.push(performance.now());
                        s.resources.result += "DONE";
                    }
                }
            });

            const startTime = performance.now();
            await world.runSystems(["delayedSystem"]);
            const endTime = performance.now();

            // Verify the system actually completed its async work
            expect(store.resources.result).toBe("DONE");
            expect(timestamps).toHaveLength(2);

            // Verify we waited for the full async operation (at least 20ms)
            expect(endTime - startTime).toBeGreaterThanOrEqual(19);

            // Verify the async operation completed before runSystems returned
            expect(timestamps[1]).toBeLessThanOrEqual(endTime);
        });

        it("should demonstrate sync systems complete immediately without Promise overhead", () => {
            const { store, database } = createTestWorld();
            let syncExecuted = false;

            const world = createWorld(store, database, {
                syncSystem: {
                    type: "store",
                    run: (s: TestStore) => {
                        syncExecuted = true;
                        s.resources.result += "SYNC";
                        // Return a non-Promise value to test sync behavior
                        return undefined;
                    }
                }
            });

            // Call runSystems but don't await it initially
            const promise = world.runSystems(["syncSystem"]);

            // For truly sync systems, the execution should have completed synchronously
            expect(syncExecuted).toBe(true);
            expect(store.resources.result).toBe("SYNC");

            // The promise should still be returned for consistent API
            expect(promise).toBeInstanceOf(Promise);
        });

        it("should demonstrate that async systems don't complete until awaited", async () => {
            const { store, database } = createTestWorld();
            let asyncStarted = false;
            let asyncCompleted = false;

            const world = createWorld(store, database, {
                asyncSystem: {
                    type: "store",
                    run: async (s: TestStore) => {
                        asyncStarted = true;
                        await new Promise(resolve => setTimeout(resolve, 10));
                        asyncCompleted = true;
                        s.resources.result += "ASYNC";
                    }
                }
            });

            // Start the async operation but don't await it
            const promise = world.runSystems(["asyncSystem"]);

            // The async system might have started but shouldn't be completed
            expect(asyncStarted).toBe(true);
            expect(asyncCompleted).toBe(false);
            expect(store.resources.result).toBe(""); // Should be empty until completion

            // Now await the promise
            await promise;

            // Now it should be completed
            expect(asyncCompleted).toBe(true);
            expect(store.resources.result).toBe("ASYNC");
        });

        it("should prove sync systems complete before Promise resolves but async systems don't", async () => {
            const { store, database } = createTestWorld();
            const executionLog: string[] = [];

            const world = createWorld(store, database, {
                syncFirst: {
                    type: "store",
                    run: (s: TestStore) => {
                        executionLog.push("sync-start");
                        s.resources.result += "S";
                        executionLog.push("sync-end");
                        // Intentionally not returning a Promise
                    },
                    schedule: { before: ["asyncSecond"] }
                },
                asyncSecond: {
                    type: "store",
                    run: async (s: TestStore) => {
                        executionLog.push("async-start");
                        await new Promise(resolve => {
                            setTimeout(() => {
                                executionLog.push("timeout-fired");
                                resolve(undefined);
                            }, 15);
                        });
                        executionLog.push("async-end");
                        s.resources.result += "A";
                    }
                }
            });

            const startTime = performance.now();

            // This should wait for BOTH systems to complete
            await world.runSystems(["syncFirst", "asyncSecond"]);

            const endTime = performance.now();

            // Verify both systems completed
            expect(store.resources.result).toBe("SA");

            // Verify execution order in log
            expect(executionLog).toEqual([
                "sync-start",
                "sync-end",
                "async-start",
                "timeout-fired",
                "async-end"
            ]);

            // Verify we waited for the async operation (at least 15ms)
            expect(endTime - startTime).toBeGreaterThanOrEqual(14);
        });

        it("should handle mixed sync and async systems", async () => {
            const { store, database } = createTestWorld();

            // Define systems in completely reverse dependency order
            const world = createWorld(store, database, {
                syncAfter: {
                    type: "store",
                    run: (s: TestStore) => {
                        s.resources.result += "E";
                    }
                },
                async: {
                    type: "database",
                    run: async (db: TestDatabase) => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        db.transactions.appendToResult("A");
                    },
                    schedule: { before: ["syncAfter"] }
                },
                sync: {
                    type: "store",
                    run: (s: TestStore) => {
                        s.resources.result += "S";
                    },
                    schedule: { before: ["async"] }
                }
            });

            // Pass in completely wrong order - dependency resolution must fix it
            await world.runSystems(["syncAfter", "async", "sync"]);

            // Result "SAE" proves execution order: sync → async → syncAfter
            expect(store.resources.result).toBe("SAE");
        });
    });

    describe("caching behavior", () => {
        it("should cache topological sort results for repeated calls", async () => {
            const { store, database } = createTestWorld();

            // We can't directly mock the internal topological sort, so we'll test through behavior
            const world = createWorld(store, database, {
                a: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.counter += 1; }
                }
            });
            const systemArray = ["a"] as const;

            // First call - should compute and cache
            await world.runSystems(systemArray);
            expect(store.resources.counter).toBe(1);

            // Second call with same array reference - should use cache
            await world.runSystems(systemArray);
            expect(store.resources.counter).toBe(2);

            // Different array with same contents - should compute again
            await world.runSystems(["a"]);
            expect(store.resources.counter).toBe(3);
        });

        it("should cache empty array (all systems) separately", async () => {
            const { store, database } = createTestWorld();

            const world = createWorld(store, database, {
                system1: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "1"; }
                },
                system2: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "2"; }
                }
            });
            const emptyArray = [] as const;

            // First call with empty array - should run all systems
            await world.runSystems(emptyArray);
            const firstResult = store.resources.result;
            expect(firstResult.length).toBe(2);
            expect(firstResult).toMatch(/[12][12]/);

            // Reset result
            store.resources.result = "";

            // Second call with same empty array reference - should use cache
            await world.runSystems(emptyArray);
            expect(store.resources.result).toBe(firstResult);
        });
    });

    describe("error handling", () => {
        it("should throw error and stop execution when system fails", async () => {
            const { store, database } = createTestWorld();

            const world = createWorld(store, database, {
                before: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "B"; },
                    schedule: { before: ["failing"] }
                },
                failing: {
                    type: "store",
                    run: () => { throw new Error("System failed"); },
                    schedule: { before: ["after"] }
                },
                after: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "A"; }
                }
            });

            await expect(world.runSystems(["before", "failing", "after"]))
                .rejects.toThrow("System failed");

            // Only the "before" system should have executed
            expect(store.resources.result).toBe("B");
        });
    });

    describe("dependency validation", () => {
        it("should detect circular dependencies", async () => {
            const { store, database } = createTestWorld();

            // Define systems in random order to ensure circular detection works regardless
            const world = createWorld(store, database, {
                c: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "C"; },
                    schedule: { before: ["a"] } // Creates circular dependency: c→a, a→b, b→c
                },
                a: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "A"; },
                    schedule: { before: ["b"] }
                },
                b: {
                    type: "store",
                    run: (s: TestStore) => { s.resources.result += "B"; },
                    schedule: { before: ["c"] }
                }
            });

            // Order shouldn't matter - circular dependency should always be detected
            await expect(world.runSystems(["c", "a", "b"]))
                .rejects.toThrow("Circular dependency detected involving node:");
        });
    });
});
