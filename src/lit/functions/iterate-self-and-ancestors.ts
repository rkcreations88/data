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

export function* iterateSelfAndAncestors(element: Element): IterableIterator<Element> {
    let current: Element | null = element;

    while (current) {
        yield current;

        if (current instanceof HTMLSlotElement && current.assignedSlot) {
            // Move to the slot's parent if the current element is assigned to a slot
            current = current.assignedSlot;
        } else if (current.parentNode instanceof Element) {
            // Move up to the parent node if it is an element
            current = current.parentNode;
        } else if ((current.getRootNode() as ShadowRoot).host) {
            // Move to the host element if we're at a shadow root
            current = (current.getRootNode() as ShadowRoot).host;
        } else {
            // If no more ancestors, stop the iteration
            current = null;
        }
    }
}