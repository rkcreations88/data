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

/**
 * Provides a combined cache interface.
 * Writes to both caches.
 * Prefers to read from the faster cache first before falling back to slower.
 */
export function createFallbackAsyncCache(
  fasterSmaller: AsyncCache<Request, Response>,
  slowerLarger: AsyncCache<Request, Response>
): AsyncCache<Request, Response> {
  return {
    async put(key: Request, value: Response): Promise<void> {
      await Promise.all([
        fasterSmaller.put(key, value),
        slowerLarger.put(key, value),
      ]);
    },
    async match(key: Request): Promise<Response | undefined> {
      return (
        (await fasterSmaller.match(key)) ?? (await slowerLarger.match(key))
      );
    },
    async delete(key: Request): Promise<void> {
      await Promise.all([fasterSmaller.delete(key), slowerLarger.delete(key)]);
    },
  };
}
