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
 * Attacheds a decorator to a method on an object and reassigns the resulting value back to the object.
 */
export function attachDecorator<T, K extends keyof T>(
    obj: T,
    property: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic type
    decorator: (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T[K]>) => PropertyDescriptor
): void {
    // Get the descriptor of the property
    let descriptor = Object.getOwnPropertyDescriptor(obj, property);

    if (!descriptor) {
        if (!obj[property]) {
            throw new Error(`Property ${property.toString()} does not exist on object`);
        }
        descriptor = {
            value: obj[property],
            writable: true,
            enumerable: true,
            configurable: true,
        };
    }

    // Apply the decorator to the descriptor
    const decoratedDescriptor = decorator(obj, String(property), descriptor);

    // Reassign the decorated method back to the object
    obj[property] = decoratedDescriptor.value;
}
