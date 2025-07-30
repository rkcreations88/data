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

import { copyViewBytes } from "../functions/copy-view-bytes.js";
import { registerCodec } from "../functions/serialization/codec.js";
import { Schema } from "../schema/schema.js";
import { createArrayBuffer } from "./create-array-buffer.js";
import { createConstBuffer } from "./create-const-buffer.js";
import { createNumberBuffer } from "./create-number-buffer.js";
import { createStructBuffer } from "./create-struct-buffer.js";
import { isTypedBuffer } from "./is-typed-buffer.js";
import { TypedBuffer, TypedBufferType } from "./typed-buffer.js";

export function registerTypedBufferCodecs() {
    registerCodec<TypedBuffer<any>>({
        name: "typed-buffer",
        predicate: isTypedBuffer,
        serialize: (data: TypedBuffer<any>) => {
            const { type, schema, capacity } = data;
            try {
                switch (type) {
                    case "const":
                        return { json: { type, schema, capacity } };
                    case "array":
                        return { json: { type, schema, capacity, array: data.slice() as unknown as any[] } };
                    case "number":
                    case "struct":
                        const typedArray = data.getTypedArray();
                        return { json: { type, schema, capacity }, binary: [new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)] };
                }
            }
            catch (e) {

                console.log("error serializing this", data, e, "data.slice", data.slice);
                throw e;
            }
        },
        deserialize: ({ json, binary }: { json?: any, binary: Uint8Array[] }) => {
            const encoded = json as { type: TypedBufferType, schema: Schema, capacity: number, array?: any[] };
            const { type, schema, capacity, array } = encoded;
            switch (type) {
                case "const": {
                    return createConstBuffer(schema, capacity);
                }
                case "array": {
                    const buffer = createArrayBuffer(schema, capacity);
                    for (let i = 0; i < capacity; i++) {
                        buffer.set(i, array![i]);
                    }
                    return buffer;
                }
                case "number": {
                    const buffer = createNumberBuffer(schema, capacity);
                    copyViewBytes(binary[0], buffer.getTypedArray());
                    return buffer;
                }
                case "struct": {
                    const buffer = createStructBuffer(schema, capacity);
                    copyViewBytes(binary[0], buffer.getTypedArray());
                    return buffer;
                }
            }
        },
    });
}
