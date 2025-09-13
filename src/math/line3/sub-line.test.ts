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

describe('Line3.subLine', () => {
    it('should create a sub-line from alpha=0 to beta=1', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [2, 4, 6]
        };
        const result = Line3.subLine(line, 0, 1);
        expect(result).toEqual({
            a: [0, 0, 0],
            b: [2, 4, 6]
        });
    });

    it('should create a sub-line from alpha=0.25 to beta=0.75', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [4, 8, 12]
        };
        const result = Line3.subLine(line, 0.25, 0.75);
        expect(result).toEqual({
            a: [1, 2, 3],
            b: [3, 6, 9]
        });
    });

    it('should create a sub-line with reversed alpha and beta', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [2, 4, 6]
        };
        const result = Line3.subLine(line, 0.75, 0.25);
        expect(result).toEqual({
            a: [1.5, 3, 4.5],
            b: [0.5, 1, 1.5]
        });
    });

    it('should handle negative coordinates', () => {
        const line: Line3 = {
            a: [-2, -4, -6],
            b: [2, 4, 6]
        };
        const result = Line3.subLine(line, 0.25, 0.75);
        expect(result).toEqual({
            a: [-1, -2, -3],
            b: [1, 2, 3]
        });
    });
}); 