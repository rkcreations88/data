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
import { deepMerge } from './deep-merge.js';
import { assert } from 'riteway/vitest';
import { describe, test } from 'vitest';

describe('deepMerge', () => {
  test('should merge two objects', () => {
    const a = { a: 1, b: 2 };
    const b = { c: 3, d: 4 };
    assert({
      given: 'two objects without overlapping keys',
      should: 'merge them',
      actual: deepMerge(a, b),
      expected: { a: 1, b: 2, c: 3, d: 4 },
    });
  });

  test('should merge two objects with overlapping keys', () => {
    const a = { a: 1, b: 2 };
    const b = { b: 3, c: 4 };
    assert({
      given: 'two objects with overlapping keys',
      should: 'merge them',
      actual: deepMerge(a, b),
      expected: { a: 1, b: 3, c: 4 },
    });
  });

  test('should merge two objects with overlapping keys and arrays', () => {
    const a = { a: 1, b: [1, 2] };
    const b = { b: [3, 4], c: 4 };
    assert({
      given: 'two objects with overlapping keys and arrays',
      should: 'merge them',
      actual: deepMerge(a, b),
      expected: { a: 1, b: [1, 2, 3, 4], c: 4 },
    });
  });

  test('should merge two nested objects with overlapping keys', () => {
    const a = { a: 1, b: { c: 2, d: 3 } };
    const b = { b: { d: 4, e: 5 }, c: 6 };
    assert({
      given: 'two nested objects with overlapping keys',
      should: 'merge them',
      actual: deepMerge(a, b),
      expected: { a: 1, b: { c: 2, d: 4, e: 5 }, c: 6 },
    });
  });

  test('should merge two objects with null values', () => {
    const a = { a: null, b: 2 };
    const b = { b: null, c: 4 };
    assert({
      given: 'two objects with null values',
      should: 'merge them',
      actual: deepMerge(a, b),
      expected: { a: null, b: null, c: 4 },
    });
  });

  test('should merge two objects with undefined values', () => {
    const a = { a: undefined, b: 2 };
    const b = { b: undefined, c: 4 };
    assert({
      given: 'two objects with undefined values',
      should: 'merge them',
      actual: deepMerge(a, b),
      expected: { a: undefined, b: undefined, c: 4 },
    });
  });

  test('should not mutate the original objects', () => {
    const a = { a: 1, b: 2 };
    const b = { b: 3, c: 4 };
    deepMerge(a, b);
    assert({ given: 'the original objects', should: 'not be mutated', actual: a, expected: { a: 1, b: 2 } });
    assert({ given: 'the original objects', should: 'not be mutated', actual: b, expected: { b: 3, c: 4 } });
  });
});
