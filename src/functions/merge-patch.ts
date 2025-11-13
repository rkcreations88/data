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
export type Patch<T> =
    | (T extends readonly any[]
        ? T                                   // arrays must be same array type
        : T extends object
        ? { [K in keyof T]?: Patch<T[K]> | null } // objects are partial; null deletes
        : T)                                  // scalars replace
    | null;

/**
 * Executes a JSON Merge Patch (RFC 7396) on `target` with `patch`.
 * - Objects: recursively merge; `null` deletes a property.
 * - Arrays: replaced wholesale (no element-wise merge).
 * - Primitives: replaced.
 * Does NOT mutate the input objects or arrays.
 */
export function mergePatch<T>(target: T, patch: Patch<T>): T {
    // null always replaces (including deleting properties when nested)
    if (patch === null) return patch as T;

    // Arrays in the patch replace wholesale
    if (Array.isArray(patch)) return patch as T;

    // Non-objects (string/number/boolean) replace
    if (typeof patch !== "object") return patch as T;

    // If target isn't a plain object, any object-like patch replaces it
    if (target === null || typeof target !== "object" || Array.isArray(target)) {
        return patch as T;
    }

    // target & patch are plain objects → merge recursively
    const result: Record<string | number | symbol, unknown> = { ...(target as any) };

    for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
        const value = (patch as any)[key];

        if (value === null) {
            // delete per RFC 7396
            delete result[key as any];
        } else {
            // recurse
            result[key as any] = mergePatch((target as any)[key], value);
        }
    }

    return result as T;
}
