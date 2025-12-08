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
 * Creates a new Observe function that batches multiple rapid emissions into a single notification.
 * If multiple values are emitted within the same microtask, only the last value is forwarded to observers
 * after the microtask boundary.
 */
export function withBatch<T>(observable: Observe<T>): Observe<T> {
    return (observer) => {
        let pendingValue: T | undefined;
        let isScheduled = false;
        let hasInitialValue = false;

        const scheduleNotification = () => {
            if (!isScheduled) {
                isScheduled = true;
                queueMicrotask(() => {
                    if (pendingValue !== undefined) {
                        observer(pendingValue);
                        pendingValue = undefined;
                    }
                    isScheduled = false;
                });
            }
        };

        const unobserve = observable((value) => {
            if (!hasInitialValue) {
                // Emit initial value immediately
                observer(value);
                hasInitialValue = true;
            } else {
                // Batch subsequent values
                pendingValue = value;
                scheduleNotification();
            }
        });

        return () => {
            unobserve();
            pendingValue = undefined;
            isScheduled = false;
            hasInitialValue = false;
        };
    };
} 