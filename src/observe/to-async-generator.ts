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

import { Observe, Unobserve } from "./types.js";

/**
 * Converts an Observe function to an AsyncGenerator that will yield values as they are observed.
 * 
 * @param observe - The Observe function to convert.
 * @param finished - A function that determines if the value is finished.
 * @returns An AsyncGenerator that will yield values as they are observed.
 */
export function toAsyncGenerator<T>(
    observe: Observe<T>,
    finished: (value: T) => boolean = v => (v as any) == null // default: stop on null/undefined,
): AsyncGenerator<T> {
    // --- tiny O(1) queue (amortized) ---
    const q: T[] = [];
    let head = 0;
    const enqueue = (v: T) => q.push(v);
    const dequeue = () => {
        const v = q[head++]!;
        // occasional compaction
        if (head > 1024 && head * 2 > q.length) {
            q.splice(0, head);
            head = 0;
        }
        return v;
    };

    let resolveNext: ((r: IteratorResult<T>) => void) | null = null;
    let rejectNext: ((e: any) => void) | null = null;
    let done = false;
    let error: any = null;

    const flush = () => {
        if (resolveNext && q.length > head) {
            const r = resolveNext;
            resolveNext = rejectNext = null;
            r({ done: false, value: dequeue() });
        } else if (resolveNext && done) {
            const r = resolveNext;
            resolveNext = rejectNext = null;
            r({ done: true, value: undefined as any });
        } else if (rejectNext && error != null) {
            const rej = rejectNext;
            resolveNext = rejectNext = null;
            const e = error;
            error = null;
            rej(e);
        }
    };

    let unobserve: Unobserve = () => { };
    try {
        unobserve = observe(v => {
            if (done || error != null) return;
            try {
                enqueue(v);
                if (finished(v)) {
                    done = true;
                }
            } catch (e) {
                error = e;
            }
            flush(); // works even if called synchronously
        });
    } catch (e) {
        error = e;
    }

    const cleanup = () => {
        if (!done) {
            done = true;
            unobserve();
        }
        // Drain queue to free memory.
        q.length = head = 0;
    };

    const iterator: AsyncGenerator<T> = {
        [Symbol.asyncIterator]() {
            return this;
        },
        next(): Promise<IteratorResult<T>> {
            if (error != null) return Promise.reject(error);
            if (q.length > head) {
                const value = dequeue();
                return Promise.resolve({ done: false, value });
            }
            if (done) return Promise.resolve({ done: true, value: undefined as any });
            return new Promise<IteratorResult<T>>((resolve, reject) => {
                resolveNext = resolve;
                rejectNext = reject;
                // Check if we already have a result to resolve immediately
                flush();
            });
        },
        return(): Promise<IteratorResult<T>> {
            cleanup();
            return Promise.resolve({ done: true, value: undefined as any });
        },
        throw(e: any): Promise<IteratorResult<T>> {
            cleanup();
            return Promise.reject(e);
        },
        // [Symbol.asyncDispose](): PromiseLike<void> {
        //     cleanup();
        //     return Promise.resolve();
        // }
    };

    return iterator;
}
