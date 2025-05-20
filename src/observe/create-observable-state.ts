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
import { Notify, Observe } from "./types.js";

/**
 * Creates a simple state observe function and a setValue function to update the value.
 * When observed, the current state if any will be immediately and synchronously sent to the observer callback.
 * @param initialValue The initial value of the state.
 */
export function createObservableState<T>(
  initialValue?: T
): [Observe<T>, (value: T) => void] {
  let value: T | undefined = initialValue;
  const observers = new Set<Notify<T>>();
  return [
    (observer) => {
      observers.add(observer);
      if (value !== undefined) {
        observer(value);
      }
      return () => {
        observers.delete(observer);
      };
    },
    (newValue) => {
      value = newValue;
      for (const observer of observers) {
        observer(newValue);
      }
    },
  ];
}
