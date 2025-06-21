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
import { withLazy } from './with-lazy.js';
import { createObservableState } from './create-observable-state.js';

describe('withLazy', () => {
    it('should defer observable creation until first subscription', () => {
        let factoryCalled = false;
        const factory = () => {
            factoryCalled = true;
            const [source] = createObservableState<number>(42);
            return source;
        };

        const lazyObs = withLazy(factory);
        expect(factoryCalled).toBe(false);

        const values: number[] = [];
        const unsubscribe = lazyObs(value => values.push(value));
        
        expect(factoryCalled).toBe(true);
        expect(values).toEqual([42]);
        
        unsubscribe();
    });

    it('should cache the observable after first creation', () => {
        let callCount = 0;
        const factory = () => {
            callCount++;
            const [source] = createObservableState<number>(42);
            return source;
        };

        const lazyObs = withLazy(factory);
        
        // First subscription
        const unsubscribe1 = lazyObs(() => {});
        expect(callCount).toBe(1);
        
        // Second subscription should reuse the same observable
        const unsubscribe2 = lazyObs(() => {});
        expect(callCount).toBe(1);
        
        unsubscribe1();
        unsubscribe2();
    });
}); 