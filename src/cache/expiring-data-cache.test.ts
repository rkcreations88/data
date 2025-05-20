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
import { createExpiringDataCache } from "./expiring-data-cache.js"; // Adjust the import path as necessary
import { describe, expect, it } from "vitest";
import { createDataCache } from "./data-cache.js";
import { getManagedPersistentCache } from "./get-persistent-cache.js";

describe("ExpiringDataCache", () => {
  it("should store and retrieve an item before it expires", async () => {
    const time = Date.now();
    let timePassed = 0;
    const getTime = () => time + timePassed;
    const cache = createExpiringDataCache<string, string>(
      createDataCache(
        await getManagedPersistentCache("expiring-data-cache-test", {
          maximumMemoryEntries: 10,
          maximumStorageEntries: 100,
        })
      ),
      getTime
    );

    cache.put("key1", "value1", { maximumDuration: 1000 }); // Expires in 1000ms
    expect(await cache.match("key1")).toBe("value1");

    timePassed = 500;
    expect(await cache.match("key1")).toBe("value1");

    timePassed = 999;
    expect(await cache.match("key1")).toBe("value1");

    timePassed = 1000;
    expect(await cache.match("key1")).toBeUndefined();

    timePassed = 1001;
    expect(await cache.match("key1")).toBeUndefined();

    timePassed = 2000;
    expect(await cache.match("key1")).toBeUndefined();
  });

  it("should immediately expire items when maximumDuration is 0", async () => {
    const time = Date.now();
    let timePassed = 0;
    const getTime = () => time + timePassed;
    const cache = createExpiringDataCache<string, string>(
      createDataCache(
        await getManagedPersistentCache("expiring-data-cache-test", {
          maximumMemoryEntries: 10,
          maximumStorageEntries: 100,
        })
      ),
      getTime
    );

    cache.put("key1", "value1", { maximumDuration: 0 }); // Expires immediately
    expect(await cache.match("key1")).toBeUndefined();

    timePassed = 1000;
    expect(await cache.match("key1")).toBeUndefined();
  });
});
