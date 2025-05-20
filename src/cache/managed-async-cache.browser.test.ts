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
import { createManagedAsyncCache } from "./managed-async-cache.js";
import { createMemoryAsyncCache } from "./memory-async-cache.js";
import { describe, expect, it } from "vitest";

describe("ManagedAsyncCache", () => {
  it("should retain new data but evict old data", async () => {
    const optimum = 4;
    const maximumEntries = optimum * 2;
    const cache = createManagedAsyncCache(createMemoryAsyncCache(), optimum);
    const count = 100;
    for (let i = 0; i < count; i++) {
      await cache.put(new Request(`key:${i}`), new Response(`value:${i}`));
    }

    // make sure we don't exceed maximum keys
    const keyCount = await cache.getKeyCountForTesting();
    //  should not store more than maximum keys
    expect(keyCount <= maximumEntries).toBe(true);

    // make the last N requests still available.
    for (let k = 0; k < optimum; k++) {
      const i = count - 1 - k;
      const value = await cache.match(new Request(`key:${i}`));
      expect(value instanceof Response).toBe(true);
    }

    //  old keys should return undefined
    expect(await cache.match(new Request(`key:0`))).toBe(undefined);
    expect(await cache.match(new Request(`key:1`))).toBe(undefined);
    expect(await cache.match(new Request(`key:2`))).toBe(undefined);
  });
});
