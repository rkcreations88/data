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
import { StringKeyof } from "../../types/types.js";
import { ArchetypeComponents, Database, Store, TransactionFunctions } from "../index.js";
import { Components } from "../store/components.js";
import { ResourceComponents } from "../store/resource-components.js";
import { System } from "./system.js";
import { World } from "./world.js";
import { topologicalSort, type Edge } from "../../internal/array/index.js";

export function createWorld<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>,
    T extends TransactionFunctions,
    SD extends Record<string, System<C, R, A, T, keyof SD & string>>,
>(
    store: Store<C, R, A>,
    database: Database<C, R, A, T>,
    systems: SD,
): World<C, R, A, T, keyof SD & string> {

    const allSystems = Object.keys(systems) as (keyof SD & string)[];

    // Cache for topological sort results to avoid re-computing for same system sets
    const topologicalSortCache = new Map<(keyof SD & string)[], (keyof SD & string)[]>();

    const runSystems = (systemNames: (keyof SD & string)[]): Promise<void> => {
        try {
            // Default to all systems if none specified
            if (systemNames.length === 0) {
                systemNames = allSystems;
            }

            // Check cache first (by array identity)
            let sortedSystems = topologicalSortCache.get(systemNames);
            if (!sortedSystems) {
                // Build dependency graph for system scheduling
                const edges = buildSystemEdges(systemNames, systems);
                sortedSystems = topologicalSort(systemNames, edges) as (keyof SD & string)[];

                // Cache the result
                topologicalSortCache.set(systemNames, sortedSystems);
            }

            // Track if any system is async
            const asyncPromises: Promise<void>[] = [];

            // Execute systems in dependency order
            for (const systemName of sortedSystems) {
                const system = systems[systemName];

                try {
                    let result: void | Promise<void> = undefined;

                    if (system.type === "store") {
                        result = system.run(store);
                    } else if (system.type === "database") {
                        result = system.run(database);
                    }

                    // Check if the result is a Promise
                    if (result && typeof result === 'object' && 'then' in result) {
                        // If we find any async system, we need to handle all remaining systems async
                        asyncPromises.push(result as Promise<void>);

                        // Switch to async mode for remaining systems
                        return executeRemainingAsync(sortedSystems, systemName, asyncPromises);
                    }
                    // If result is not a Promise, continue synchronously
                } catch (error) {
                    console.error(`System ${String(systemName)} failed:`, error);
                    return Promise.reject(error);
                }
            }

            // If we reach here, all systems were synchronous
            return Promise.resolve();
        } catch (error) {
            // Handle errors from topological sort (e.g., circular dependencies)
            return Promise.reject(error);
        }
    };

    // Helper function to handle async execution once we encounter the first async system
    const executeRemainingAsync = async (
        sortedSystems: (keyof SD & string)[],
        currentSystemName: keyof SD & string,
        pendingPromises: Promise<void>[]
    ): Promise<void> => {
        // Wait for the current async system to complete
        await Promise.all(pendingPromises);

        // Find the index of current system to continue from next one
        const currentIndex = sortedSystems.indexOf(currentSystemName);

        // Execute remaining systems asynchronously
        for (let i = currentIndex + 1; i < sortedSystems.length; i++) {
            const systemName = sortedSystems[i];
            const system = systems[systemName];

            try {
                if (system.type === "store") {
                    await system.run(store);
                } else if (system.type === "database") {
                    await system.run(database);
                }
            } catch (error) {
                console.error(`System ${String(systemName)} failed:`, error);
                throw error;
            }
        }
    };

    // Build edges for system dependency graph
    const buildSystemEdges = (systemNames: (keyof SD & string)[], systemMap: SD): Edge<string>[] => {
        const edges: Edge<string>[] = [];

        systemNames.forEach(name => {
            const system = systemMap[name];
            const nameStr = String(name);

            // Convert 'before' constraints to edges: current → dependency
            // (current system must run before the dependency)
            system.schedule?.before?.forEach(dep => {
                if (systemNames.includes(dep)) {
                    edges.push([nameStr, String(dep)]);
                }
            });

            // Convert 'after' constraints to edges: dependency → current  
            // (current system must run after the dependency)
            system.schedule?.after?.forEach(dep => {
                if (systemNames.includes(dep)) {
                    edges.push([String(dep), nameStr]);
                }
            });
        });

        return edges;
    };

    return {
        ...database,
        runSystems,
    }
}
