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
import { describe, it, expect, vi } from 'vitest';
import { withBatch } from './with-batch.js';
import { createObservableState } from './create-observable-state.js';

describe('withBatch', () => {
    it('should batch multiple rapid emissions into a single notification', async () => {
        const [source, setSource] = createObservableState<number>(1);
        const batched = withBatch(source);
        
        const observedValues: number[] = [];
        const unsubscribe = batched((value) => {
            observedValues.push(value);
        });

        // Initial value should be emitted immediately
        expect(observedValues).toEqual([1]);

        // Multiple rapid updates should be batched
        setSource(2);
        setSource(3);
        setSource(4);

        // Should not have emitted yet (still in same microtask)
        expect(observedValues).toEqual([1]);

        // Wait for next microtask
        await new Promise(resolve => setTimeout(resolve, 0));

        // Should have emitted only the last value
        expect(observedValues).toEqual([1, 4]);

        unsubscribe();
    });

    it('should handle multiple batches correctly', async () => {
        const [source, setSource] = createObservableState<number>(1);
        const batched = withBatch(source);
        
        const observedValues: number[] = [];
        const unsubscribe = batched((value) => {
            observedValues.push(value);
        });

        // Initial value
        expect(observedValues).toEqual([1]);

        // First batch
        setSource(2);
        setSource(3);

        // Second batch (after microtask)
        await new Promise(resolve => setTimeout(resolve, 0));
        setSource(4);
        setSource(5);

        // Should have emitted only the last value from first batch
        expect(observedValues).toEqual([1, 3]);

        // Wait for second batch
        await new Promise(resolve => setTimeout(resolve, 0));

        // Should have emitted only the last value from second batch
        expect(observedValues).toEqual([1, 3, 5]);

        unsubscribe();
    });

    it('should handle unsubscribe correctly', async () => {
        const [source, setSource] = createObservableState<number>(1);
        const batched = withBatch(source);
        
        const observedValues: number[] = [];
        const unsubscribe = batched((value) => {
            observedValues.push(value);
        });

        // Initial value
        expect(observedValues).toEqual([1]);

        // Update and unsubscribe before microtask
        setSource(2);
        unsubscribe();

        // Wait for microtask
        await new Promise(resolve => setTimeout(resolve, 0));

        // Should not have emitted after unsubscribe
        expect(observedValues).toEqual([1]);
    });

    it('should work with multiple observers', async () => {
        const [source, setSource] = createObservableState<number>(1);
        const batched = withBatch(source);
        
        const values1: number[] = [];
        const values2: number[] = [];

        const unsubscribe1 = batched((value) => values1.push(value));
        const unsubscribe2 = batched((value) => values2.push(value));

        // Both observers should get initial value
        expect(values1).toEqual([1]);
        expect(values2).toEqual([1]);

        // Multiple rapid updates
        setSource(2);
        setSource(3);
        setSource(4);

        // Wait for microtask
        await new Promise(resolve => setTimeout(resolve, 0));

        // Both observers should get only the last value
        expect(values1).toEqual([1, 4]);
        expect(values2).toEqual([1, 4]);

        unsubscribe1();
        unsubscribe2();
    });
}); 