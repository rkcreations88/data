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
import { memoize } from "./memoize.js";
import { preventParallelExecution } from "./prevent-parallel-execution.js";
import { describe, expect, it } from "vitest";

describe("Function", () => {
  describe("prevent parallel execution", () => {
    it("should block parallel execution and return same promise", async () => {
      let addCallCount = 0;
      async function add(a: number, b: number): Promise<number> {
        addCallCount++;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(a + b);
          }, 100);
        });
      }

      async function testAddBlocksParallelExecution(addFn: typeof add) {
        addCallCount = 0;
        const promises = [addFn(1, 2), addFn(1, 2), addFn(1, 2)];
        const results = await Promise.all(promises);
        expect(results).toEqual([3, 3, 3]);
      }

      const addFn = preventParallelExecution(add);
      await testAddBlocksParallelExecution(addFn);
      // after all have completed... then another can execute
      addCallCount = 0;
      expect(await addFn(1, 2)).toEqual(3);
      expect(addCallCount).toEqual(1);
    });
  });

  describe("memoize", () => {
    it("should block parallel execution and return same promise", async () => {
      let addCallCount = 0;
      async function add(a: number, b: number): Promise<number> {
        addCallCount++;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(a + b);
          }, 100);
        });
      }

      async function testAddBlocksParallelExecution(addFn: typeof add) {
        addCallCount = 0;
        const promises = [addFn(1, 2), addFn(1, 2), addFn(1, 2)];
        const results = await Promise.all(promises);
        expect(results).toEqual([3, 3, 3]);
      }

      //  now memoize the addFn and verify that it is cached.
      const addFn = memoize("addFn-v1", add);
      await testAddBlocksParallelExecution(addFn);
      // after all have completed... then another can execute
      addCallCount = 0;
      expect(await addFn(1, 2)).toEqual(3);
      // with memoize, the count should be 0 because we get a cached result.
      expect(addCallCount).toEqual(0);
    });
  });
});
