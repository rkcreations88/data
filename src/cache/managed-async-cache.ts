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
import type { AsyncCache, AsyncCacheWithKeys } from "./async-cache.js";

const CREATED_HEADER = "ManagedAsyncCache.Created";

export function createManagedAsyncCache(
  cache: AsyncCacheWithKeys<Request, Response>,
  optimumEntries: number
): AsyncCache<Request, Response> & {
  getKeyCountForTesting(): Promise<number>;
} {
  const maximumEntries = optimumEntries * 2;
  let putCount = 0;

  const maybeManageCacheOnPut = async () => {
    if (putCount++ % optimumEntries === 0) {
      let keys = [...(await cache.keys())];
      if (keys.length >= maximumEntries) {
        // sort by created. ISO date strings are comparable by date
        keys = keys.sort((a, b) => {
          const aheader = a.headers.get(CREATED_HEADER);
          const bheader = b.headers.get(CREATED_HEADER);
          if (!aheader || !bheader) {
            return 0;
          }
          return aheader.localeCompare(bheader);
        });
        while (keys.length > optimumEntries) {
          const key = keys.shift();
          if (key) {
            await cache.delete(key);
          }
        }
      }
    }
  };

  return {
    async put(key: Request, value: Response): Promise<void> {
      // add a created header as metadata to the request
      key.headers.set(CREATED_HEADER, new Date().toISOString());
      await cache.put(key, value);
      await maybeManageCacheOnPut();
    },

    async match(key: Request): Promise<Response | undefined> {
      return cache.match(key);
    },

    async delete(key: Request): Promise<void> {
      await cache.delete(key);
    },

    async getKeyCountForTesting(): Promise<number> {
      return (await cache.keys()).length;
    },
  };
}
