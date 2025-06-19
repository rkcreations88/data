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
import { normalize } from "../../core/normalize.js";
import { deepMerge } from "./deep-merge.js";
import { Schema } from "../schema.js";
import { enumeratePatches } from "./enumerate-patches.js";
import jp from "jsonpath";

/**
 * Gets a dynamic schema from a static schema with conditionals and a current value.
 */
export function getDynamicSchema(schema: Schema, value: unknown): Schema {
    let input = schema;
    for (let i = 0; i < 20; i++) {
        const output = structuredClone(input);
        for (const { path, fragment } of enumeratePatches(input, value)) {
            const node = jp.value(output, jp.stringify(path));
            if (typeof node !== "object" || node === null) {
                throw new Error(`Target node MUST be an object, found: ${JSON.stringify(node)} at ${jp.stringify(path)}`);
            }
            Object.assign(node, deepMerge(node, fragment, { mergeArrays: false }));
        }
        if (JSON.stringify(normalize(input)) === JSON.stringify(normalize(output))) {
            return output;
        }
        input = output;
    }
    throw new Error("Failed resolve stable dynamic schema");
}
