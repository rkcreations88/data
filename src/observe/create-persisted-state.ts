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
import { createState } from "./create-state.js";
import { Observe } from "./index.js";

/**
 * Creates a simple state observable that also returns a function to update the value.
 * The state is persisted to the provided storage.
 * Since this is stored in localStorage or sessionStorage it should not be used for large data.
 * @param key The key to use for storage.
 * @param initialValue The initial value of the state.
 * @param storage The storage to use for persistence.
 */
export function createPersistedState<T extends Data>(
  key: string,
  initialValue?: T,
  storage = localStorage
): [Observe<T>, (value: T) => void] {
  // Try to load initial state from storage
  let storedValue: T | undefined;
  const storedData = storage.getItem(key);
  if (storedData) {
    try {
      storedValue = JSON.parse(storedData) as T;
    } catch (e) {
      console.warn(`Error parsing stored data for key ${key}:`, e);
    }
  }

  // Create observable state with either stored or initial value
  const [observable, setValue] = createState(storedValue ?? initialValue);

  // Wrap setValue to persist changes to storage
  const setValueAndStore = (value: T) => {
    setValue(value);
    storage.setItem(key, JSON.stringify(value));
  };

  return [observable, setValueAndStore];
}
