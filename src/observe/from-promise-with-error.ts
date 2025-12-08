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
import { Observe } from "./index.js";

/**
 * Creates a new Observer that will notify observers exactly once when the promise is resolved.
 * In the event of an error, the observer will be notified with the error.
 * Note that the promise is only created when the first observer is added so it is lazy.
 */
export function fromPromiseWithError<T, E extends Error>(
  promiseFactory: () => Promise<T>
): Observe<T | E> {
  let promise: Promise<T> | undefined = undefined;
  return (observer) => {
    let cancelled = false;
    promise = promise ?? promiseFactory();
    promise
      .then((value) => {
        if (!cancelled) {
          observer(value);
        }
      })
      .catch((error: E) => {
        if (!cancelled) {
          observer(error);
        }
      });
    return () => {
      cancelled = true;
    };
  };
}
