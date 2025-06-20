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

import { type Data } from "../data.js";
import { type DataCache, DataCacheInternal } from "./data-cache.js";

type ExpiringData<T extends Data> = {
  expiration: number | null;
  value: T;
};

/**
 * Creates a new expiring data cache with the specified underlying cache.
 */
export function createExpiringDataCache<K extends Data, V extends Data>(
  baseCache: DataCacheInternal<K, V>,
  getTime = () => Date.now()
): DataCache<K, V> {
  const cache = baseCache as unknown as DataCacheInternal<K, ExpiringData<V>>;
  return {
    async match(key: K): Promise<V | undefined> {
      const entry = await cache.match(key);
      if (!entry) {
        return undefined;
      }
      if (entry.expiration != null && entry.expiration <= getTime()) {
        await cache.delete(key);
        return undefined;
      }
      return entry.value;
    },
    async put(key: K, value: V, options): Promise<void> {
      const { maximumDuration: maxDuration } = options || {};
      const expiration =
        (maxDuration !== undefined) && maxDuration >= 0 ? getTime() + maxDuration : null;
      await cache.put(key, { value, expiration });
    },
    async delete(key: K): Promise<void> {
      await cache.delete(key);
    },
  };
}
