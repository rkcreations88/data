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
import { Notify, Observe, Unobserve } from "./types.js";

/**
 * Creates a new Observe function that will cache the last value and notify observers immediately with the last value.
 * Also prevents the base observe function from being called more than once with multiple simultaneous observers.
 */

export function withCache<T>(observable: Observe<T>): Observe<T> {
  let value: T | undefined = undefined;
  let hasValue = false;
  const observers = new Set<Notify<T>>();
  let unobserve: Unobserve | null = null;
  return (observer) => {
    observers.add(observer);
    if (hasValue) {
      observer(value as T);
    }

    if (observers.size === 1) {
      unobserve = observable((newValue) => {
        hasValue = true;
        value = newValue;
        for (const callback of observers) {
          callback(newValue);
        }
      });
    }

    return () => {
      observers.delete(observer);
      if (observers.size === 0 && unobserve) {
        unobserve();
        value = undefined;
        hasValue = false;
        unobserve = null;
      }
    };
  };
}
