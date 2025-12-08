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
import { fromElementPropertyAndEvents } from "./from-element-properties-and-events.js";
import { Observe } from "./index.js";

//  private helper function to create an observable from an element property and a mutation observer.
function fromElementPropertyAndMutationObserver<
  T extends HTMLElement,
  K extends keyof T,
>(element: T, property: K): Observe<T[K]> {
  return (observer) => {
    observer(element[property]);
    const mutationObserver = new MutationObserver((mutations) => {
      //  this should only be called when the property changes.
      //  check that this specific property was changed
      for (const mutation of mutations) {
        if (mutation.attributeName === property) {
          observer(element[property]);
          break;
        }
      }
    });
    mutationObserver.observe(element, { attributes: true });
    return () => {
      mutationObserver.disconnect();
    };
  };
}

/**
 * Returns an observable that will notify observers when the element property changes.
 * If there are any events provided, then the observer will be notified when the event is triggered.
 * If there are not then a dom mutation observer will be used to watch for changes.
 * @param element The element to watch a property for changes.
 * @param property The property on the element to watch for changes.
 * @param events The events that will trigger a new notification of changed values.
 * @returns
 */
export function fromElementProperty<
  T extends HTMLElement,
  K extends keyof T,
  E extends keyof HTMLElementEventMap,
>(element: T, property: K, events: E[] = []): Observe<T[K]> {
  if (events.length > 0) {
    return fromElementPropertyAndEvents(element, property, events);
  } else {
    return fromElementPropertyAndMutationObserver(element, property);
  }
}
