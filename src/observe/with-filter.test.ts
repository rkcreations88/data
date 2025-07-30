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

import { describe, test, expect } from "vitest";
import { withFilter } from "./with-filter.js";
import { fromConstant } from "./from-constant.js";

describe("withFilter", () => {
    test("should filter out undefined values", () => {
        const observable = fromConstant(5);
        const filtered = withFilter(observable, (value) =>
            value > 3 ? value * 2 : undefined
        );

        let result: number | undefined;
        filtered((value) => {
            result = value;
        })();

        expect(result).toBe(10);
    });

    test("should filter out all values when filter returns undefined", () => {
        const observable = fromConstant(5);
        const filtered = withFilter(observable, () => undefined);

        let called = false;
        filtered(() => {
            called = true;
        })();

        expect(called).toBe(false);
    });

    test("should pass through values when filter returns non-undefined", () => {
        const observable = fromConstant("hello");
        const filtered = withFilter(observable, (value) =>
            value.length > 3 ? value.toUpperCase() : undefined
        );

        let result: string | undefined;
        filtered((value) => {
            result = value;
        })();

        expect(result).toBe("HELLO");
    });

    test("should handle mixed filtering in sequence", () => {
        const values: number[] = [];
        const observable = (observer: (value: number) => void) => {
            observer(1);
            observer(2);
            observer(3);
            observer(4);
            observer(5);
            return () => { };
        };

        const filtered = withFilter(observable, (value) =>
            value % 2 === 0 ? value * 2 : undefined
        );

        filtered((value) => {
            values.push(value);
        })();

        expect(values).toEqual([4, 8]);
    });
}); 