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

/**
 * Very-fast deep equality for JSON-style values.
 *
 * Assumptions
 * ───────────
 * • Only JSON primitives, plain objects, and arrays appear.
 * • Objects have **no prototype chain** (so every enumerable key is "own,"
 *   letting us skip costly `hasOwnProperty` checks).
 * • No cyclic references (add a WeakMap if you need that).
 */
export function equals(a: unknown, b: unknown): boolean {
  // 1  Primitives / identical reference
  if (Object.is(a, b)) return true; // Handles NaN === NaN
  if (a == null || b == null) return false;          // null / undefined mismatch
  if (typeof a !== "object" || typeof b !== "object") return false;

  // 2  Arrays
  const aIsArr = Array.isArray(a);
  const bIsArr = Array.isArray(b);
  if (aIsArr || bIsArr) {
    if (aIsArr !== bIsArr) return false;             // one array, one object
    const aa = a as unknown[];
    const bb = b as unknown[];
    if (aa.length !== bb.length) return false;
    for (let i = 0; i < aa.length; i++) {
      if (!equals(aa[i], bb[i])) return false;
    }
    return true;
  }

  // 3  Plain objects
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;

  let keyBalance = 0;                                // = keys(a) – keys(b)

  // Pass 1: walk keys of a, compare values, and tally count.
  for (const k in ao) {
    keyBalance++;                                    // saw a key from a
    if (!(k in bo)) return false;                    // missing in b
    if (!equals(ao[k], bo[k])) return false;         // value differs
  }

  // Pass 2: walk keys of b to detect extras.
  for (const _ in bo) keyBalance--;

  return keyBalance === 0;                           // zero ⇒ same key set
}
