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

// src/set-methods.d.ts
/* eslint-disable @typescript-eslint/consistent-type-definitions */

declare global {
    interface Set<T> {
        /** Returns a new set with the elements of `this` ∪ `other`. */
        union<U>(other: Set<U>): Set<T | U>;

        /** Returns a new set with the elements of `this` ∩ `other`. */
        intersection<U>(other: Set<U>): Set<T & U>;

        /** Returns a new set with the elements of `this` ∖ `other`. */
        difference<U>(other: Set<U>): Set<T | U>;

        /** Returns a new set with the elements of `(this ∖ other) ∪ (other ∖ this)`. */
        symmetricDifference<U>(other: Set<U>): Set<T | U>;

        /** `true` if every element of `this` is also in `other`. */
        isSubsetOf<U>(other: Set<U>): boolean;

        /** `true` if every element of `other` is also in `this`. */
        isSupersetOf<U>(other: Set<U>): boolean;

        /** `true` if `this` and `other` share no elements. */
        isDisjointFrom<U>(other: Set<U>): boolean;
    }

    // (Optional) mirror the same methods on ReadonlySet:
    interface ReadonlySet<T> {
        union<U>(other: ReadonlySet<U>): Set<T | U>;
        intersection<U>(other: ReadonlySet<U>): Set<T & U>;
        difference<U>(other: ReadonlySet<U>): Set<T | U>;
        symmetricDifference<U>(other: ReadonlySet<U>): Set<T | U>;
        isSubsetOf<U>(other: ReadonlySet<U>): boolean;
        isSupersetOf<U>(other: ReadonlySet<U>): boolean;
        isDisjointFrom<U>(other: ReadonlySet<U>): boolean;
    }
}

export { };
