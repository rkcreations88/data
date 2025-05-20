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
import { type AsyncDataFunction } from "./types.js";

import { type Data } from "../../core/data.js";

/**
 * Returns an async function which can NOT be executed simultaneously with the same arguments.
 * Any attempt to call again while a prior call with same args is executing will return the first promise.
 * Once a promise completes, then a new call with same args could occur.
 */
export function preventParallelExecution<In extends Array<unknown>, Out>(
  fn: AsyncDataFunction<In, Out>
): AsyncDataFunction<In, Out> {
  const executing = new Map<string, Promise<Out>>();
  const synchronized = async (...args: Array<Data>): Promise<Out> => {
    const key = JSON.stringify(args);
    let promise = executing.get(key);
    if (!promise) {
      promise = fn(...(args as In));
      executing.set(key, promise);
    }
    try {
      return await promise;
    } finally {
      // we delete the key after execution to prevent memory leak.
      executing.delete(key);
    }
  };
  return synchronized as unknown as AsyncDataFunction<In, Out>;
}
