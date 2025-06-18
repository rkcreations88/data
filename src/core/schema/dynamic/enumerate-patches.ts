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
import { Schema } from "../schema.js";
import jp, { PathComponent } from "jsonpath";
import { isValid } from "../validation/is-valid.js";

export type EnumeratePatch = {
    /** The path to the target node. */
    path: PathComponent[];
    /** The fragment that will be patched into the target. */
    fragment: unknown;
}

export function* enumeratePatches(
    currentSchema: Schema,
    currentValue: unknown,
    rootValue: unknown = currentValue,
    rootSchema: Schema = currentSchema,
    currentPath: PathComponent[] = ["$"],
    localPath: PathComponent[] = ["$"],
): Generator<EnumeratePatch> {
    if (currentValue === undefined || currentValue === null) {
        return;
    }
    // local conditionals
    for (const c of currentSchema.conditionals ?? []) {
        // get the value of the current path
        const localValue = jp.value(rootValue, jp.stringify(localPath));
        // if (currentSchema.conditionals) {
        //     console.log("enumeratePatches", JSON.stringify(c, null, 2));
        //     // console.log("currentPath", currentPath);
        //     // console.log("localPath", localPath);
        //     console.log("localValue", localValue);
        // }
        if (!c.match || isValid(c.match, localValue)) {
            // jsonpath.query returns *values*, not references to
            // the parent object.  We use jp.paths to get the JSONPaths
            // of selected nodes, then query again to fetch each node.
            for (const p of jp.paths(rootSchema, c.path)) {
                yield { path: p, fragment: c.value };
            }
        }
    }

    // recurse

    // items
    if (currentSchema.items && Array.isArray(currentValue)) {
        for (const [i, childSchema] of Object.entries(currentSchema.items)) {
            for (const val of currentValue) {
                yield* enumeratePatches(childSchema, val, rootValue, rootSchema, [...currentPath, "items", i], [...localPath, i]);
            }
        }
    }

    // properties
    if (currentSchema.properties && typeof currentValue === "object") {
        for (const [k, childSchema] of Object.entries(currentSchema.properties)) {
            yield* enumeratePatches(childSchema, (currentValue as any)[k], rootValue, rootSchema, [...currentPath, "properties", k], [...localPath, k]);
        }
    }

    // oneOf 
    if (currentSchema.oneOf?.length) {
        for (const branch of currentSchema.oneOf) {
            if (isValid(branch, currentValue)) {
                yield* enumeratePatches(branch, currentValue, rootValue, rootSchema, [...currentPath, "oneOf"], [...localPath]);
            }
        }
    }
}
