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


import { describe, it, expect } from 'vitest';
import { Line2 } from '../index.js';

describe('Line2.intersects', () => {
    it('should return true for intersecting lines', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [0, 2],
            b: [2, 0]
        };
        expect(Line2.intersects(line1, line2)).toBe(true);
    });

    it('should return false for parallel lines', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [0, 1],
            b: [2, 3]
        };
        expect(Line2.intersects(line1, line2)).toBe(false);
    });

    it('should return false for non-intersecting lines', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [3, 0],
            b: [5, 2]
        };
        expect(Line2.intersects(line1, line2)).toBe(false);
    });

    it('should return true for lines that intersect at endpoints', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [2, 2],
            b: [4, 4]
        };
        expect(Line2.intersects(line1, line2, false)).toBe(false);
        expect(Line2.intersects(line1, line2, true)).toBe(true);
    });

    it('should return false for collinear lines that do not overlap', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [3, 3],
            b: [5, 5]
        };
        expect(Line2.intersects(line1, line2)).toBe(false);
    });

    it('should handle vertical and horizontal lines', () => {
        const vertical: Line2 = {
            a: [1, 0],
            b: [1, 2]
        };
        const horizontal: Line2 = {
            a: [0, 1],
            b: [2, 1]
        };
        expect(Line2.intersects(vertical, horizontal)).toBe(true);
    });

    it('should handle lines with negative coordinates', () => {
        const line1: Line2 = {
            a: [-2, -2],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [-2, 2],
            b: [2, -2]
        };
        expect(Line2.intersects(line1, line2)).toBe(true);
    });
}); 