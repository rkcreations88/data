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
import { fromConstant } from "./from-constant.js";
import { Observe } from "./index.js";

/**
 * Uses DOM MutationObserver to watch for the addition or removal of an element with a specific id.
 * @param id The id of the element to watch for.
 * @returns a new Observe<Element | null> which yields null if element does not exist.
 */

export function fromElementId<T extends HTMLElement = HTMLElement>(
  ancestor: HTMLElement | ShadowRoot,
  id: string
): Observe<T | null> {
  if (id === "") {
    return fromConstant(null);
  }
  return (observer) => {
    let lastElement: T | null = null;
    const notify = () => {
      const newElement = document.getElementById(id) as T | null;
      if (!lastElement || newElement !== lastElement) {
        lastElement = newElement;
        observer(newElement);
      }
    };
    notify();
    const mutationObserver = new MutationObserver((mutations) => {
      let changed = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if ((node as T).id === id) {
              changed = true;
            }
          }
          if (!changed) {
            for (const node of mutation.removedNodes) {
              if ((node as T).id === id) {
                changed = true;
              }
            }
          }
        }
      }
      if (changed) {
        notify();
      }
    });
    mutationObserver.observe(ancestor, { childList: true, subtree: true });
    return () => {
      mutationObserver.disconnect();
    };
  };
}
