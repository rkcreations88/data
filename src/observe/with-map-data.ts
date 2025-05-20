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
import { Observe } from "./types.js";
import { withCopy } from "./with-copy.js";
import { withDeduplicateData } from "./with-deduplicate-data.js";
import { withMap } from "./with-map.js";

/**
 * A higher order observable that maps to a specific data value, deduplicates the data, and copies the data.
 * withMapData(observable, map) = withCopy(withDeduplicateData(withMap(observable, map)))
 */
export function withMapData<T, U extends Data>(
  observable: Observe<T>,
  map: (value: T) => U
): Observe<U> {
  return withCopy(withDeduplicateData(withMap(observable, map)));
}
