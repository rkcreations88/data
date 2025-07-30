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
import { createConstBuffer } from './create-const-buffer.js';

describe('createConstBuffer', () => {
    it('should always return the same value for any get call', () => {
        const constValue = { x: 10, y: 20 };
        const buffer = createConstBuffer({ const: constValue }, 5);
        
        // All get calls should return the same value
        expect(buffer.get(0)).toBe(constValue);
        expect(buffer.get(1)).toBe(constValue);
        expect(buffer.get(2)).toBe(constValue);
        expect(buffer.get(3)).toBe(constValue);
        expect(buffer.get(4)).toBe(constValue);
        expect(buffer.get(100)).toBe(constValue); // Even out of bounds
    });

    it('should allow capacity and capacity on construction', () => {
        const buffer = createConstBuffer({ const: 10 }, 5);
        expect(buffer.capacity).toBe(5);
    });

    it('should ignore set calls', () => {
        const constValue = 42;
        const buffer = createConstBuffer({ const: constValue }, 3);
        
        // Set calls should not change the value
        buffer.set(0, 100);
        buffer.set(1, 200);
        buffer.set(2, 300);
        
        // All get calls should still return the original value
        expect(buffer.get(0)).toBe(constValue);
        expect(buffer.get(1)).toBe(constValue);
        expect(buffer.get(2)).toBe(constValue);
    });

    it('should track capacity correctly', () => {
        const buffer = createConstBuffer({ const: 'test' }, 10);        
        expect(buffer.capacity).toBe(10);
        buffer.capacity = 20;
        expect(buffer.capacity).toBe(20);
    });

    it('should throw error for getTypedArray', () => {
        const buffer = createConstBuffer({ const: 123 }, 1);
        
        expect(() => {
            buffer.getTypedArray();
        }).toThrow('Const buffer does not support getTypedArray');
    });

    it('should support slicing', () => {
        const buffer = createConstBuffer({ const: 'sliceable' }, 5);
        
        const values = Array.from(buffer.slice());
        expect(values).toEqual(['sliceable', 'sliceable', 'sliceable', 'sliceable', 'sliceable']);
    });

    it('should support partial slicing', () => {
        const buffer = createConstBuffer({ const: 'partial' }, 4);
        
        // Slice first 2 elements
        const firstSlice = Array.from(buffer.slice(0, 2));
        expect(firstSlice).toEqual(['partial', 'partial']);
        
        // Slice last 2 elements
        const lastSlice = Array.from(buffer.slice(2, 4));
        expect(lastSlice).toEqual(['partial', 'partial']);
        
        // Slice with default end
        const defaultEndSlice = Array.from(buffer.slice(1));
        expect(defaultEndSlice).toEqual(['partial', 'partial', 'partial']);
    });

    it('should work with complex objects', () => {
        const complexValue = {
            id: 1,
            name: 'test',
            nested: { value: 42 }
        };
        
        const buffer = createConstBuffer({ const: complexValue }, 2);
        
        expect(buffer.get(0)).toBe(complexValue);
        expect(buffer.get(1)).toBe(complexValue);
    });

    it('should work with primitive values', () => {
        const numberBuffer = createConstBuffer({ const: 42 }, 1);
        const stringBuffer = createConstBuffer({ const: 'hello' }, 1);
        const booleanBuffer = createConstBuffer({ const: true }, 1);

        expect(numberBuffer.get(0)).toBe(42);
        expect(stringBuffer.get(0)).toBe('hello');
        expect(booleanBuffer.get(0)).toBe(true);
    });
}); 