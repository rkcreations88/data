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
import { useElement } from "./use-element.js";
import { useEffect } from "./use-effect.js";

export interface UpdateEventHost {
    updateListeners: Set<() => void>;
}

function hasUpdateListeners(el: unknown): el is UpdateEventHost {
    return (
        typeof el === 'object' &&
        el !== null &&
        'updateListeners' in el &&
        el['updateListeners'] instanceof Set
    );
}

function makeUpdateEventHost<T extends Element>(
    el: T
): T & UpdateEventHost {
    if (hasUpdateListeners(el)) return el as T & UpdateEventHost;

    const updateListeners = new Set<() => void>();
    Object.defineProperty(el, 'updateListeners', {
        value: updateListeners,
        writable: false,
        enumerable: false,
    });

    if (!('updated' in el)) {
        throw new Error('Element does not have an updated method');
    }

    const element = el as unknown as T & {
        updated: (changedProps: Map<PropertyKey, unknown>) => void;
    } & UpdateEventHost;
    const orig = element.updated.bind(el);

    element.updated = (changedProps) => {
        orig(changedProps);
        for (const fn of updateListeners) fn();
    };

    return element;
}


export function useUpdated(listener: () => void, dependencies: unknown[] = []) {
    const element = makeUpdateEventHost(useElement());
    useEffect(() => {
        element.updateListeners.add(listener);
        return () => {
            element.updateListeners.delete(listener);
        }
    }, dependencies);
}
