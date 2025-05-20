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

// Create a WeakMap to store cached values for each object
const cache = new WeakMap<object, Map<Function, unknown>>();

/**
 * Gets a cached value for an object using a factory function.
 * If the value hasn't been cached yet, the factory function will be called to create it.
 * The cache is stored on the object itself using a WeakMap, allowing for garbage collection
 * when the object is no longer referenced.
 * 
 * @param context The object to cache the value on
 * @param factory A function that creates the value to be cached
 * @returns The cached value or a newly created value from the factory
 */
export function getCached<A extends object, B>(
    context: A,
    factory: (obj: A) => B
): B {
    // Get or create the factory map for this object
    let factoryMap = cache.get(context) as Map<Function, B> | undefined;
    if (!factoryMap) {
        factoryMap = new Map();
        cache.set(context, factoryMap);
    }

    // Get or create the cached value for this factory
    let value = factoryMap.get(factory);
    if (value === undefined) {
        value = factory(context);
        factoryMap.set(factory, value);
    }

    return value;
} 