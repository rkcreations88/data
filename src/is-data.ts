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

import { Assert } from "./types/assert.js";

export type Primitive = string | number | boolean | null;

/** invariant type-equality check (handles `readonly` correctly) */
export type EqualReadonly<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2)
  ? (<T>() => T extends Y ? 1 : 2) extends
  (<T>() => T extends X ? 1 : 2)
  ? true
  : false
  : false;

/** are *all* own props already `readonly`?  */
export type IsFullyReadonly<T> = EqualReadonly<T, Readonly<T>>;

export type IsData<T> =
  // primitives
  [T] extends [Primitive]
  ? true
  // **readonly** arrays whose items are Data
  : T extends ReadonlyArray<infer U>
  ? EqualReadonly<T, ReadonlyArray<U>> extends true
  ? IsData<U>
  : false
  // plain objects: 1) fully readonly, 2) every value is Data
  : T extends object
  ? IsFullyReadonly<T> extends true
  ? { [K in keyof T]-?: IsData<T[K]> }[keyof T] extends false
  ? false
  : true
  : false
  : false;

// Compile time tests

interface Foo {
  x: number;          // mutable  ❌
}

interface Bar {
  readonly x: number; // readonly ✔️
}

type IsFooData = Assert<EqualReadonly<IsData<Foo>, false>>; // false
type IsBarData = Assert<EqualReadonly<IsData<Bar>, true>>; // true