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
        union(other: Set<T>): Set<T>;

        /** Returns a new set with the elements of `this` ∩ `other`. */
        intersection(other: Set<T>): Set<T>;

        /** Returns a new set with the elements of `this` ∖ `other`. */
        difference(other: Set<T>): Set<T>;

        /** Returns a new set with the elements of `(this ∖ other) ∪ (other ∖ this)`. */
        symmetricDifference(other: Set<T>): Set<T>;

        /** `true` if every element of `this` is also in `other`. */
        isSubsetOf(other: Set<T>): boolean;

        /** `true` if every element of `other` is also in `this`. */
        isSupersetOf(other: Set<T>): boolean;

        /** `true` if `this` and `other` share no elements. */
        isDisjointFrom(other: Set<T>): boolean;
    }

    // (Optional) mirror the same methods on ReadonlySet:
    interface ReadonlySet<T> {
        union(other: Set<T>): Set<T>;
        intersection(other: Set<T>): Set<T>;
        difference(other: Set<T>): Set<T>;
        symmetricDifference(other: Set<T>): Set<T>;
        isSubsetOf(other: Set<T>): boolean;
        isSupersetOf(other: Set<T>): boolean;
        isDisjointFrom(other: Set<T>): boolean;
    }
}

export { };
