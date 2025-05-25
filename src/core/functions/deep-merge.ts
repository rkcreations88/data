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
import { type Data } from '../data.js';

/**
 * Uses datacache to store results so we can avoid expensive recomputations of the same input.
 * This function also uses preventParallelExecution to prevent multiple executions of the same function at the same time with the same arguments.
 * @param fn The function to memoize by storing results in the DataCache.
 * @param version The version of this function. If the function changes this must also change
 * to avoid returning stale results from an older version of the function.
 * @param name The name of this function which should be application unique to avoid hash collisions.
 * @returns A function with the same signature but memoized results.
 */

/**
 * Recursively merges 2 pieces of `Data`, returns new `Data`.
 * Inputs are not mutated.
 * 
 * @param {Data} a First piece of `Data`.
 * @param {Data} b The second piece of `Data`.
 * @returns {Object} Returns new `Data`.
 * @example
 *
 * const one = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * const other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * deepMerge(one, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
export const deepMerge = <A, B>(a: A, b: B, options: { mergeArrays?: boolean } = {}): A & B => {
  const { mergeArrays = true } = options;
  // Handle null/undefined cases
  if (a == null || typeof a !== 'object' || typeof b !== 'object') return b as A & B;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (mergeArrays) {
      return [...a, ...b] as unknown as A & B;
    } else {
      return b as A & B;
    }
  }

  // Handle objects
  const result = { ...a } as Record<string, Data>;
  for (const key in b) {
    if (Object.prototype.hasOwnProperty.call(b, key)) {
      const value = (b as Record<string, Data>)[key];
      result[key] = deepMerge((a as Record<string, Data>)[key], value, options);
    }
  }
  return result as A & B;
};