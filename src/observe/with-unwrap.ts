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
 * Unwraps a nested observable to provide a single observable with the inner observable's values.
 */

export function withUnwrap<T>(
  observable: Observe<Observe<T>>
): Observe<T> {
  return (observer) => {
    let currentUnsubscribe: Unobserve | null = null; // Track the current subscription

    const unsubscribe = observable((innerObservable) => {
      // Unsubscribe from the current inner observable before subscribing to the new one
      if (currentUnsubscribe) {
        currentUnsubscribe();
      }

      // Subscribe to the new inner observable and update the currentUnsubscribe
      currentUnsubscribe = innerObservable((value) => {
        observer(value);
      });
    });

    // Return a new unsubscribe function that unsubscribes from both the outer and current inner observables
    return () => {
      unsubscribe(); // Unsubscribe from the outer observable
      if (currentUnsubscribe) {
        currentUnsubscribe(); // Ensure we unsubscribe from the current inner observable
      }
    };
  };
}
