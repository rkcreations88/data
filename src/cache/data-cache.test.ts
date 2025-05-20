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
import { getDataCache } from "./data-cache.js";
import { beforeAll, describe, expect, it } from "vitest";

describe("DataCache", () => {
  beforeAll(() => {});
  it("should allow storing and retrieving values in namespaced/versioned caches", async () => {
    //  get a namespaced cache
    const cache = await getDataCache("test:v1");

    //  create some keys and values to store
    const key = { foo: 1, bar: [{ baz: 12 }] };
    const valueIn = { alpha: "bet", bar: ["a", "b"] };

    //  store a key/value pair
    await cache.put(key, valueIn);

    //  retrieve the value
    const valueOut = await cache.match(key);

    //  output is NOT identical
    expect(valueOut !== valueIn).toBe(true);

    //  output IS structurally equal
    expect(valueOut).toEqual(valueIn);

    //  output from structurally equivalent key is the same
    expect(await cache.match(JSON.parse(JSON.stringify(key)))).toEqual(valueIn);

    //  output from equivalent cache (constructed with same name/version) is the same.
    expect(await (await getDataCache("test:v1")).match(key)).toEqual(valueIn);

    //  output from different named cache is undefined
    expect(await (await getDataCache("test2:v1")).match(key)).toEqual(
      undefined
    );

    //  output from different cache version is undefined
    expect(await (await getDataCache("test:v2")).match(key)).toEqual(undefined);
  });
});
