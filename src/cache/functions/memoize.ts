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

import { preventParallelExecution } from "./prevent-parallel-execution.js";
import { AsyncDataFunction } from "./async-data-function.js";

import { type Data } from "../../core/data.js";
import { getDataCache } from "../index.js";

/**
 * Uses datacache to store results so we can avoid expensive recomputations of the same input.
 * This function also uses preventParallelExecution to prevent multiple executions of the same function at the same time with the same arguments.
 * @param fn The function to memoize by storing results in the DataCache.
 * @param version The version of this function. If the function changes this must also change
 * to avoid returning stale results from an older version of the function.
 * @param name The name of this function which should be application unique to avoid hash collisions.
 * @returns A function with the same signature but memoized results.
 */
export function memoize<In extends Array<Data>, Out extends Data>(
  uniqueNameAndVersion: string,
  fn: AsyncDataFunction<In, Out>
): AsyncDataFunction<In, Out> {
  // synchronize the function to prevent executing same requests simultaneously.
  fn = preventParallelExecution(fn);
  const cache = getDataCache(uniqueNameAndVersion);
  const memoized = async (...args: Array<Data>): Promise<Data> => {
    const cachedResult = await cache.match(args);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    const result = await fn(...(args as In));
    await cache.put(args, result);
    return result;
  };
  return memoized as unknown as AsyncDataFunction<In, Out>;
}
