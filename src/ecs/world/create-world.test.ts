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
            const executionOrder: string[] = [];

            // Define second system first to test dependency resolution
            const world = createWorld(store, database, {
                sync2: {
                    type: "store",
                    run: (s: TestStore) => {
                        executionOrder.push("sync2");
                        s.resources.result += "2";
                    }
                },
                sync1: {
                    type: "store",
                    run: (s: TestStore) => {
                        executionOrder.push("sync1");
                        s.resources.result += "1";
                    },
                    schedule: { before: ["sync2"] }
                }
            });

            // Pass in reverse order - dependency resolution should fix it
            await world.runSystems(["sync2", "sync1"]);

            expect(store.resources.result).toBe("12");
            expect(executionOrder).toEqual(["sync1", "sync2"]);
        });

        it("should properly await asynchronous systems", async () => {
            const { store, database } = createTestWorld();
            const executionOrder: string[] = [];

            // Define second async system first to test dependency resolution
            const world = createWorld(store, database, {
                async2: {
                    type: "store",
                    run: async (s: TestStore) => {
                        await new Promise(resolve => setTimeout(resolve, 5));
                        executionOrder.push("async2");
                        s.resources.result += "B";
                    }
                },
                async1: {
                    type: "store",
                    run: async (s: TestStore) => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        executionOrder.push("async1");
                        s.resources.result += "A";
                    },
                    schedule: { before: ["async2"] }
                }
            });

            // Pass in wrong order - should still execute A then B due to dependencies
            await world.runSystems(["async2", "async1"]);

            expect(store.resources.result).toBe("AB");
            expect(executionOrder).toEqual(["async1", "async2"]);
        });

        it("should handle mixed sync and async systems", async () => {
            const { store, database } = createTestWorld();
            const executionOrder: string[] = [];

            // Define systems in completely reverse dependency order
            const world = createWorld(store, database, {
                syncAfter: {
                    type: "store",
                    run: (s: TestStore) => {
                        executionOrder.push("syncAfter");
                        s.resources.result += "E";
                    }
                },
                async: {
                    type: "database",
                    run: async (db: TestDatabase) => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        executionOrder.push("async");
                        db.transactions.appendToResult("A");
                    },
                    schedule: { before: ["syncAfter"] }
                },
                sync: {
                    type: "store",
                    run: (s: TestStore) => {
                        executionOrder.push("sync");
                        s.resources.result += "S";
                    },
                    schedule: { before: ["async"] }
                }
            });

            // Pass in completely wrong order - dependency resolution must fix it
            await world.runSystems(["syncAfter", "async", "sync"]);

            expect(store.resources.result).toBe("SAE");
            expect(executionOrder).toEqual(["sync", "async", "syncAfter"]);
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
