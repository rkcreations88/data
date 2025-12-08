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

/**
 * An Observe type is a function that can be called to observe a sequence of values.
 * The Observe function is called with a Callback function that may be called zero or more times.
 * The Observe function returns an Unobserve function that can be called to stop observing the Observe function.
 */
export type Observe<T> = (notify: Notify<T>) => Unobserve;

/**
 * Callback function called zero or more times with a sequence of values.
 * *may* be called back synchronously, immediately when selector function is called.
 * *may* also be called back later asynchronously any number of times.
 * *may* be called multiple sequential times with the same value.
 */
export type Notify<T> = (value: T) => void;

/**
 * Function called to stop observing an Observe function.
 */
export type Unobserve = () => void;

export * as Observe from "./public.js";
