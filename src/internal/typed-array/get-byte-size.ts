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
import type { TypedArrayConstructor } from "../../types/typed-array-constructer.js";

export const getByteSize = (typedArrayConstructor: TypedArrayConstructor) => {
    if (typedArrayConstructor === Int32Array) {
        return 4;
    }
    if (typedArrayConstructor === Uint32Array) {
        return 4;
    }
    if (typedArrayConstructor === Float32Array) {
        return 4;
    }
    if (typedArrayConstructor === Float64Array) {
        return 8;
    }
    if (typedArrayConstructor === Int8Array) {
        return 1;
    }
    if (typedArrayConstructor === Uint8Array) {
        return 1;
    }
    if (typedArrayConstructor === Int16Array) {
        return 2;
    }
    if (typedArrayConstructor === Uint16Array) {
        return 2;
    }
    throw new Error(`Unknown typed array constructor: ${typedArrayConstructor}`);
}