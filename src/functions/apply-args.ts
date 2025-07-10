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

import { Assert } from "../types/assert.js";
import { Equal } from "../types/equal.js";

/**
 * Calls each function in the object with the argument and returns an object
 * with the same keys and the return values of the functions.
 */
export function applyArg<A, T extends Record<string, (a: A) => any>>(
    arg: A,
    toFunctions: T,
): {
        [K in keyof T]: T[K] extends (a: A) => infer R ? R : never;
    } {
    const result = {} as any;
    for (const key in toFunctions) {
        result[key] = toFunctions[key](arg);
    }
    return result;
}

(() => {
    const foo = {
        a: (a: number) => () => a + 1,
        b: (a: number) => (b: number) => a + b,
    }
    const bar = applyArg(1, foo);
    type Check = Assert<Equal<typeof bar, { a: () => number; b: (b: number) => number }>>;
})