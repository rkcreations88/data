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
import { SystemNames, World } from "./world.js";
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

    const runSystems = async (systemNames: (keyof SD & string)[]) => {
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

        // Execute systems in dependency order
        for (const systemName of sortedSystems) {
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
