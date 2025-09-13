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
import { Line3 } from '../index.js';

describe('Line3.interpolate', () => {
    it('should Line3.interpolate at alpha = 0', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [2, 4, 6]
        };
        const result = Line3.interpolate(line, 0);
        expect(result).toEqual([0, 0, 0]);
    });

    it('should Line3.interpolate at alpha = 1', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [2, 4, 6]
        };
        const result = Line3.interpolate(line, 1);
        expect(result).toEqual([2, 4, 6]);
    });

    it('should Line3.interpolate at alpha = 0.5', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [2, 4, 6]
        };
        const result = Line3.interpolate(line, 0.5);
        expect(result).toEqual([1, 2, 3]);
    });

    it('should Line3.interpolate with negative coordinates', () => {
        const line: Line3 = {
            a: [-2, -4, -6],
            b: [2, 4, 6]
        };
        const result = Line3.interpolate(line, 0.5);
        expect(result).toEqual([0, 0, 0]);
    });

    it('should Line3.interpolate with fractional alpha', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [10, 20, 30]
        };
        const result = Line3.interpolate(line, 0.3);
        expect(result).toEqual([3, 6, 9]);
    });
}); 