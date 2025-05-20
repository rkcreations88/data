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
import type { AsyncCacheWithKeys } from "./async-cache.js";

/**
 * This should never be used directly as it will never free cache entries making it leak memory.
 * It should only ever be used as a base cache inside of a ManagedAsyncCache.
 */
export function createMemoryAsyncCache(): AsyncCacheWithKeys<
  Request,
  Response
> {
  const cache = new Map<string, [Request, Response]>();
  return {
    put(key: Request, value: Response): Promise<void> {
      cache.set(key.url, [key, value.clone()]);
      return Promise.resolve();
    },

    match(key: Request): Promise<Response | undefined> {
      return Promise.resolve(cache.get(key.url)?.[1]?.clone());
    },

    async delete(key: Request): Promise<void> {
      await Promise.resolve(cache.delete(key.url));
    },

    keys(): Promise<ReadonlyArray<Request>> {
      return Promise.resolve([...cache.values()].map((value) => value[0]));
    },
  };
}
