import { Data } from "../data.js";
import { registerCodec } from "../functions/serialization/codec.js";
import { createArrayBuffer } from "./create-array-buffer.js";
import { createConstBuffer } from "./create-const-buffer.js";
import { createNumberBuffer } from "./create-number-buffer.js";
import { isTypedBuffer } from "./is-typed-buffer.js";
import { TypedBuffer, TypedBufferType } from "./typed-buffer.js";

export function registerTypedBufferCodecs() {
    registerCodec<TypedBuffer<any>>({
        name: "typed-buffer",
        predicate: isTypedBuffer,
        serialize: (data: TypedBuffer<any>) => {
            const { type } = data;
            switch (type) {
                case "array":
                    return { json: { type, array: data.slice() as unknown as any[] } };
                case "const":
                    return { json: { type, value: data.get(0) } };
                case "number":
                    return { json: { type }, binary: [new Uint8Array(data.slice())] };
                case "struct":
                    return { json: { type }, binary: [new Uint8Array(data.getTypedArray().buffer)] };
            }
        },
        deserialize: ({ json, binary }: { json?: Data, binary: Uint8Array[] }) => {
            const encoded = json as { type: TypedBufferType, array?: any[], value?: any };
            const { type } = encoded;
            switch (type) {
                case "array":
                    throw new Error("Not implemented");
                    // return createArrayBuffer({ array: encoded.array! })
                case "const":
                    throw new Error("Not implemented");
                    // return createConstBuffer(encoded.value!);
                case "number":
                    throw new Error("Not implemented");
                    // return createNumberBuffer({ arrayBuffer: binary[0].subarray(). });
                case "struct":
                    throw new Error("Not implemented");
                    // return { json: { type }, binary: [new Uint8Array(data.getTypedArray().buffer)] };
            }
            throw "not implemented";
        },
    });
}
