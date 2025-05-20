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

import { getCached } from "./get-cached.js";
import { describe, expect, it } from "vitest";

describe("getCached", () => {
    it("should cache values on objects", () => {
        const obj = { id: 1 };
        let factoryCallCount = 0;

        const factory = (o: typeof obj) => {
            factoryCallCount++;
            return { computed: o.id * 2 };
        };

        // First call should invoke factory
        const result1 = getCached(obj, factory);
        expect(result1).toEqual({ computed: 2 });
        expect(factoryCallCount).toBe(1);

        // Second call should use cached value
        const result2 = getCached(obj, factory);
        expect(result2).toEqual({ computed: 2 });
        expect(factoryCallCount).toBe(1);
    });

    it("should cache different values for different objects", () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };
        let factoryCallCount = 0;

        const factory = (o: typeof obj1) => {
            factoryCallCount++;
            return { computed: o.id * 2 };
        };

        // Call for first object
        const result1 = getCached(obj1, factory);
        expect(result1).toEqual({ computed: 2 });
        expect(factoryCallCount).toBe(1);

        // Call for second object should invoke factory again
        const result2 = getCached(obj2, factory);
        expect(result2).toEqual({ computed: 4 });
        expect(factoryCallCount).toBe(2);
    });

    it("should cache different values for different factories on same object", () => {
        const obj = { id: 1 };
        let factory1CallCount = 0;
        let factory2CallCount = 0;

        const factory1 = (o: typeof obj) => {
            factory1CallCount++;
            return { computed: o.id * 2 };
        };

        const factory2 = (o: typeof obj) => {
            factory2CallCount++;
            return { computed: o.id * 3 };
        };

        // Call first factory
        const result1 = getCached(obj, factory1);
        expect(result1).toEqual({ computed: 2 });
        expect(factory1CallCount).toBe(1);
        expect(factory2CallCount).toBe(0);

        // Call second factory
        const result2 = getCached(obj, factory2);
        expect(result2).toEqual({ computed: 3 });
        expect(factory1CallCount).toBe(1);
        expect(factory2CallCount).toBe(1);
    });

    it("should handle primitive values", () => {
        const obj = { id: 1 };
        let factoryCallCount = 0;

        const factory = (o: typeof obj) => {
            factoryCallCount++;
            return o.id * 2;
        };

        const result1 = getCached(obj, factory);
        expect(result1).toBe(2);
        expect(factoryCallCount).toBe(1);

        const result2 = getCached(obj, factory);
        expect(result2).toBe(2);
        expect(factoryCallCount).toBe(1);
    });
}); 