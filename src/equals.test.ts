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

import { equals } from './equals.js';
import { describe, expect, it } from 'vitest';

describe('equals', () => {
  describe('primitives and identical references', () => {
    it('should return true for identical primitive values', () => {
      expect(equals(42, 42)).toBe(true);
      expect(equals('hello', 'hello')).toBe(true);
      expect(equals(true, true)).toBe(true);
      expect(equals(false, false)).toBe(true);
    });

    it('should return true for identical object references', () => {
      const obj = { a: 1 };
      expect(equals(obj, obj)).toBe(true);
    });

    it('should return false for different primitive values', () => {
      expect(equals(42, 43)).toBe(false);
      expect(equals('hello', 'world')).toBe(false);
      expect(equals(true, false)).toBe(false);
    });
  });

  describe('null and undefined handling', () => {
    it('should return false when one value is null and other is not', () => {
      expect(equals(null, 42)).toBe(false);
      expect(equals(42, null)).toBe(false);
      expect(equals(null, 'hello')).toBe(false);
      expect(equals('hello', null)).toBe(false);
    });

    it('should return false when one value is undefined and other is not', () => {
      expect(equals(undefined, 42)).toBe(false);
      expect(equals(42, undefined)).toBe(false);
      expect(equals(undefined, 'hello')).toBe(false);
      expect(equals('hello', undefined)).toBe(false);
    });

    it('should return false when one is null and other is undefined', () => {
      expect(equals(null, undefined)).toBe(false);
      expect(equals(undefined, null)).toBe(false);
    });
  });

  describe('type mismatch handling', () => {
    it('should return false when one is primitive and other is object', () => {
      expect(equals(42, {})).toBe(false);
      expect(equals({}, 42)).toBe(false);
      expect(equals('hello', [])).toBe(false);
      expect(equals([], 'hello')).toBe(false);
    });
  });

  describe('arrays', () => {
    it('should return true for identical arrays', () => {
      expect(equals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(equals(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(equals([], [])).toBe(true);
    });

    it('should return false when one is array and other is object', () => {
      expect(equals([1, 2, 3], { 0: 1, 1: 2, 2: 3 })).toBe(false);
      expect(equals({ 0: 1, 1: 2, 2: 3 }, [1, 2, 3])).toBe(false);
    });

    it('should return false for arrays with different lengths', () => {
      expect(equals([1, 2], [1, 2, 3])).toBe(false);
      expect(equals([1, 2, 3], [1, 2])).toBe(false);
    });

    it('should return false for arrays with different values', () => {
      expect(equals([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(equals([1, 2, 3], [1, 3, 2])).toBe(false);
    });

    it('should handle nested arrays', () => {
      expect(equals([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
      expect(equals([[1, 2], [3, 4]], [[1, 2], [3, 5]])).toBe(false);
    });

    it('should handle arrays with mixed content', () => {
      expect(equals([1, 'hello', { a: 1 }], [1, 'hello', { a: 1 }])).toBe(true);
      expect(equals([1, 'hello', { a: 1 }], [1, 'hello', { a: 2 }])).toBe(false);
    });
  });

  describe('objects', () => {
    it('should return true for identical objects', () => {
      expect(equals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(equals({}, {})).toBe(true);
    });

    it('should return false for objects with different keys', () => {
      expect(equals({ a: 1 }, { b: 1 })).toBe(false);
      expect(equals({ a: 1, b: 2 }, { a: 1 })).toBe(false);
      expect(equals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should return false for objects with same keys but different values', () => {
      expect(equals({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(equals({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should handle nested objects', () => {
      expect(equals({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      expect(equals({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it('should handle objects with arrays', () => {
      expect(equals({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
      expect(equals({ a: [1, 2] }, { a: [1, 3] })).toBe(false);
    });

    it('should handle complex nested structures', () => {
      const obj1 = { a: [1, { b: 2, c: [3, 4] }], d: { e: 5 } };
      const obj2 = { a: [1, { b: 2, c: [3, 4] }], d: { e: 5 } };
      const obj3 = { a: [1, { b: 2, c: [3, 5] }], d: { e: 5 } };
      
      expect(equals(obj1, obj2)).toBe(true);
      expect(equals(obj1, obj3)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle objects with numeric keys', () => {
      expect(equals({ '0': 1, '1': 2 }, { '0': 1, '1': 2 })).toBe(true);
      expect(equals({ '0': 1, '1': 2 }, { '0': 1, '1': 3 })).toBe(false);
    });

    it('should handle empty arrays and objects', () => {
      expect(equals([], [])).toBe(true);
      expect(equals({}, {})).toBe(true);
      expect(equals([], {})).toBe(false);
    });

    it('should handle objects with undefined values', () => {
      expect(equals({ a: undefined }, { a: undefined })).toBe(true);
      expect(equals({ a: undefined }, { a: null })).toBe(false);
    });

    it('should handle objects with null values', () => {
      expect(equals({ a: null }, { a: null })).toBe(true);
      expect(equals({ a: null }, { a: undefined })).toBe(false);
    });

    it('should handle NaN values', () => {
      expect(equals(NaN, NaN)).toBe(true);
      expect(equals(NaN, 42)).toBe(false);
      expect(equals(42, NaN)).toBe(false);
    });
  });
}); 