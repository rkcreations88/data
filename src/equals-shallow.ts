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

export function equalsShallow(a: unknown, b: unknown): boolean {
  // primitives / identical refs
  if (a === b) return true;
  if (
    a === null || b === null ||
    typeof a !== "object" || typeof b !== "object"
  ) return false;

  // arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    const aa = a as unknown[];
    const bb = b as unknown[];
    if (aa.length !== bb.length) return false;
    for (let i = 0; i < aa.length; i++) {
      if (aa[i] !== bb[i]) return false;
    }
    return true;
  }
  if (Array.isArray(b)) return false;

  // plain objects
  let keysA = 0;
  for (const k in a as Record<string, unknown>) {
    if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k])
      return false;
    keysA++;
  }

  // ensure no extra keys in b
  let keysB = 0;
  for (const _ in b as Record<string, unknown>) keysB++;

  return keysA === keysB;
}
