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
import { isTypedBuffer } from './is-typed-buffer.js';
import { createNumberBuffer } from './create-number-buffer.js';
import { createArrayBuffer } from './create-array-buffer.js';
import { createStructBuffer } from './create-struct-buffer.js';
import { createTypedBuffer } from './create-typed-buffer.js';

describe('isTypedBuffer', () => {
    it('should return true for createNumberBuffer', () => {
        const buffer = createNumberBuffer({ type: 'number', precision: 1 }, 2);
        expect(isTypedBuffer(buffer)).toBe(true);
    });
    it('should return true for createArrayBuffer', () => {
        const buffer = createArrayBuffer({ type: 'string' }, 2);
        expect(isTypedBuffer(buffer)).toBe(true);
    });
    it('should return true for createStructBuffer', () => {
        const schema = { type: 'object', properties: { x: { type: 'number', precision: 1 } } } as const;
        const buffer = createStructBuffer(schema, 2);
        expect(isTypedBuffer(buffer)).toBe(true);
    });
    it('should return true for createTypedBuffer', () => {
        const buffer = createTypedBuffer({ type: 'number', precision: 1 }, 2);
        expect(isTypedBuffer(buffer)).toBe(true);
    });
}); 