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
import { type AsyncCache } from "./async-cache.js";
import { type BlobRef, BlobStore, isBlobRef, blobStore } from "./blob-store.js";
import { getManagedPersistentCache } from "./get-persistent-cache.js";

import { type Data } from "../data.js";
import { createExpiringDataCache } from "./expiring-data-cache.js";

export type DataCacheInternal<K extends Data, V extends Data> = AsyncCache<
  K,
  V
>;

/**
 * A persistent cache that stores data with an optional expiration time.
 */
export interface DataCache<K extends Data, V extends Data> { 
  /**
   * Stores a new value within the cache.
   * @param key key to use to store the value
   * @param value the value to store
   * @param maxDuration the time to live relative to the current time
   */
  put(key: K, value: V, options?: { maximumDuration: number }): Promise<void>;
  /**
   * Attempts to retrieve a value from the cache.
   * @param key The key previously used to store the value.
   */
  match(key: K): Promise<V | undefined>;
  /**
   * Deletes an item from the cache.
   * @param key The key previously used to store the value.
   */
  delete(key: K): Promise<void>;
}

/**
 * Recursively searches arbitrary JSON data and locates any BlobRefs within it.
 */
function getBlobRefsInternal(
  d: Data,
  refs: Array<BlobRef> = []
): Array<BlobRef> {
  if (d && typeof d === "object") {
    if (isBlobRef(d)) {
      refs.push(d);
    }
    for (const value of Array.isArray(d) ? d : Object.values(d)) {
      getBlobRefsInternal(value, refs);
    }
  }
  return refs;
}

export function getBlobRefs(d: Data): Array<BlobRef> {
  return getBlobRefsInternal(d);
}

function toRequest(data: Data) {
  return new Request("http://cache.key?" + encodeURI(JSON.stringify(data)));
}

async function areAllBlobRefsPresentInBlobStore(
  blobstore: BlobStore,
  data: Data
): Promise<boolean> {
  for (const ref of getBlobRefs(data)) {
    //  TODO: consider using a batched request to the blobstore or await Promise.all
    if (!(await blobstore.hasBlob(ref))) {
      // a contained blob ref is expired, so the entire data structure is expired
      return false;
    }
  }
  return true;
}

export function createDataCache<K extends Data, V extends Data>(
  cache: AsyncCache<Request, Response>
): DataCacheInternal<K, V> {
  return {
    async match(k: K): Promise<V | undefined> {
      const response = await cache.match(toRequest(k));
      return response?.json();
    },
    async put(k: K, v: V): Promise<void> {
      const blob = new Blob([JSON.stringify(v)], { type: "application/json" });
      await cache.put(toRequest(k), new Response(blob));
    },
    async delete(k: K): Promise<void> {
      await cache.delete(toRequest(k));
    },
  };
}

export function createBlobRefAwareDataCache<
  K extends Data = Data,
  V extends Data = Data,
>(
  baseCache: DataCacheInternal<K, V> = dataCache as DataCacheInternal<K, V>,
  blobstore = blobStore
): DataCacheInternal<Data, Data> {
  return {
    ...baseCache,
    async match(k: K): Promise<Data | undefined> {
      const result = await baseCache.match(k);
      if (
        result !== undefined &&
        !(await areAllBlobRefsPresentInBlobStore(blobstore, result))
      ) {
        await baseCache.delete(k);
        return undefined;
      }
      return result;
    },
  };
}

const managedPersistentCache = await getManagedPersistentCache("datacache", {
  maximumMemoryEntries: 100,
  maximumStorageEntries: 1000,
});
const blobRefAwareDataCache = await createBlobRefAwareDataCache(
  createDataCache(managedPersistentCache)
);
export const dataCache: DataCache<Data, Data> = createExpiringDataCache(
  blobRefAwareDataCache
);

/**
 * Retrieves a namespaced data cache. Calling it multiple times will return an equivalent cache.
 * Values stored within a data cache generally persist across sessions.
 * @param nameSpace A unique string used to isolate values within this cache from other caches.
 */
export function getDataCache<K extends Data, V extends Data>(
  nameSpace: string
): DataCache<K, V> {
  return getNamespacedDataCacheInternal(nameSpace, dataCache);
}

function getNamespacedDataCacheInternal<K extends Data, V extends Data>(
  name: string,
  mainCache = dataCache
): DataCache<K, V> {
  if (!name || name.length === 0) {
    throw new Error(`name is required`);
  }

  const getNSKey = (key: K) => {
    return { name, key };
  };

  return {
    async match(key: K): Promise<V | undefined> {
      return (await mainCache.match(getNSKey(key))) as V | undefined;
    },
    async put(key: K, value: V, options): Promise<void> {
      await mainCache.put(getNSKey(key), value, options);
    },
    async delete(key: K): Promise<void> {
      await mainCache.delete(getNSKey(key));
    },
  };
}
