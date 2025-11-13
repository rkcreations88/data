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
import { Data } from "../../data.js";
import { registerCodec } from "./codec.js";

export function registerBlobCodecs() {
    // Built in support for blobs
    // registerCodec<any>({
    //     name: "Blob",
    //     predicate: (data: any): data is any => data instanceof Blob,
    //     serialize: (data: Blob) => ({ json: data.type,  binary: [data.] }),
    //     deserialize: ({ binary }: { json?: Data, binary: Uint8Array[] }) => new (typedArrayConstructor as any)(binary[0].buffer, binary[0].byteOffset, binary[0].byteLength / typedArrayConstructor.BYTES_PER_ELEMENT),
    // });
}
