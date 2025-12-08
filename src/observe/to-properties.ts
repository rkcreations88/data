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
import { Data } from "../index.js";
import { Observe } from "./index.js";
import { withMapData } from "./with-map-data.js";

/**
 * Returns an object which contains an observe function for each key in the input object.
 * Each individual observe function will only notify observers when it's own value has changed.
 */
export function toProperties<
  T extends { [K: string]: Data },
  Keys extends keyof T
>(
  observable: Observe<T>,
  keys: Keys[]
)
  : { readonly [K in Keys]: Observe<T[K]>; } {
  return Object.fromEntries(
    keys.map((key) => [key, withMapData(observable, (value) => value[key])])
  ) as unknown as { readonly [K in keyof T]: Observe<T[K]>; }
}
