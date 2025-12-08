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

import { Data } from "../data.js";
import { createState } from "./create-state.js";
import { Observe } from "./index.js";

export type SetValue<T> = (value: T) => void;

/**
 * Creates an observable state that syncs with URL query parameters.
 * @param key - The query parameter key to use
 * @param initialValue - The initial value if no query parameter exists
 * @param options - Configuration options
 * @returns A tuple containing the observe function and the setValue function
 */
export const createQueryState = <T extends Data>(
    key: string,
    initialValue: T,
    options: {
        serialize?: (value: T) => string;
        deserialize?: (value: string) => T;
        replaceState?: boolean;
    } = {}
): [Observe<T>, SetValue<T>] => {
    const {
        serialize = (v) => JSON.stringify(v),
        deserialize = (v) => JSON.parse(v),
        replaceState = false
    } = options;

    // Get initial value from URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const urlValue = urlParams.get(key);
    const initial = urlValue ? deserialize(urlValue) : initialValue;

    // Create the observable state
    const [observe, setValue] = createState<T>(initial);

    // Create a wrapped setValue that updates both state and URL
    const setQueryValue: SetValue<T> = (newValue: T) => {
        setValue(newValue);

        const url = new URL(window.location.href);
        const serialized = serialize(newValue);

        if (serialized === serialize(initialValue)) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, serialized);
        }

        // Update URL without page reload
        if (replaceState) {
            window.history.replaceState({}, '', url.toString());
        } else {
            window.history.pushState({}, '', url.toString());
        }
    };

    // Listen for browser back/forward navigation
    window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlValue = urlParams.get(key);
        if (urlValue) {
            setValue(deserialize(urlValue));
        } else {
            setValue(initialValue);
        }
    });

    return [observe, setQueryValue];
}; 