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

type SystemDeclaration = {
    readonly create: (...args: any[]) => any;
    readonly schedule?: {
        readonly before?: readonly string[];
        readonly after?: readonly string[];
    };
};

/**
 * Calculates the execution order for systems based on their scheduling constraints.
 * Returns a 2D array where each sub-array represents a tier of systems that can
 * execute in parallel.
 * 
 * @param systems - Object mapping system names to their declarations
 * @returns Array of tiers, where each tier is an array of system names that can run in parallel
 * @throws Error if circular dependencies are detected
 */
export const calculateSystemOrder = <S extends string>(
    systems: { readonly [K in S]: SystemDeclaration }
): S[][] => {
    const systemNames = Object.keys(systems) as S[];

    if (systemNames.length === 0) {
        return [];
    }

    // Build dependency graph: dependsOn[system] = set of systems that must run before it
    const dependsOn = new Map<S, Set<S>>();

    for (const name of systemNames) {
        dependsOn.set(name, new Set());
    }

    // Process scheduling constraints
    for (const name of systemNames) {
        const system = systems[name];
        const schedule = system.schedule;

        if (schedule?.after) {
            for (const dep of schedule.after) {
                dependsOn.get(name)!.add(dep as S);
            }
        }

        if (schedule?.before) {
            for (const dependent of schedule.before) {
                dependsOn.get(dependent as S)!.add(name);
            }
        }
    }

    // Topological sort with tier grouping
    const tiers: S[][] = [];
    const processed = new Set<S>();
    const inProgress = new Set<S>();

    const detectCycle = (node: S, visited: Set<S>, stack: Set<S>): boolean => {
        if (stack.has(node)) {
            return true;
        }
        if (visited.has(node)) {
            return false;
        }

        visited.add(node);
        stack.add(node);

        const deps = dependsOn.get(node)!;
        for (const dep of deps) {
            if (detectCycle(dep, visited, stack)) {
                return true;
            }
        }

        stack.delete(node);
        return false;
    };

    // Check for cycles
    const visited = new Set<S>();
    const stack = new Set<S>();
    for (const name of systemNames) {
        if (detectCycle(name, visited, stack)) {
            throw new Error("Circular dependency detected in system scheduling");
        }
    }

    // Build tiers
    while (processed.size < systemNames.length) {
        const currentTier: S[] = [];
        
        for (const name of systemNames) {
            if (processed.has(name)) {
                continue;
            }
            
            // Check if all dependencies are processed
            const deps = dependsOn.get(name)!;
            const allDepsProcessed = Array.from(deps).every(dep => processed.has(dep));
            
            if (allDepsProcessed) {
                currentTier.push(name);
            }
        }
        
        if (currentTier.length === 0) {
            // Should never happen if cycle detection works
            throw new Error("Unable to resolve system dependencies");
        }
        
        // Sort tier alphabetically for deterministic output
        currentTier.sort();
        tiers.push(currentTier);
        
        for (const name of currentTier) {
            processed.add(name);
        }
    }

    return tiers;
};

