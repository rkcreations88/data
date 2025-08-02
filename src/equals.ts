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

import { isTypedBuffer } from "./typed-buffer/is-typed-buffer.js";
import { typedBufferEquals } from "./typed-buffer/typed-buffer-equals.js";

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
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  // 2  Arrays
  const aIsArr = Array.isArray(a);
  const bIsArr = Array.isArray(b);
  if (aIsArr || bIsArr) {
    if (aIsArr !== bIsArr) return false;
    const aa = a as unknown[];
    const bb = b as unknown[];
    if (aa.length !== bb.length) return false;
    for (let i = 0; i < aa.length; i++) {
      if (!equals(aa[i], bb[i])) return false;
    }
    return true;
  }

  // 3  Typed-buffer fast path
  const aBuf = isTypedBuffer(a);
  const bBuf = isTypedBuffer(b);
  if (aBuf || bBuf) {
    return aBuf && bBuf ? typedBufferEquals(a as any, b as any) : false;
  }

  // 4  Plain objects
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;

  let keyBalance = 0;

  for (const k in ao) {
    keyBalance++;
    if (!(k in bo)) return false;
    if (!equals(ao[k], bo[k])) return false;
  }
  for (const _ in bo) keyBalance--;

  return keyBalance === 0;
}
