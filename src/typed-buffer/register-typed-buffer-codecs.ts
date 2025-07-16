import { Data } from "../data.js";
import { registerCodec } from "../functions/serialization/codec.js";
import { isTypedBuffer } from "./is-typed-buffer.js";
import { TypedBuffer } from "./typed-buffer.js";

export function registerTypedBufferCodecs() {
    registerCodec<TypedBuffer<any>>({
        name: "typed-buffer",
        predicate: isTypedBuffer,
        serialize: (data: TypedBuffer<any>) => {
            switch (data.type) {
                case "array":
                    return { json: { type: "array", array: data.slice() as unknown as any[] } };
                case "const":
                    return { json: { type: "const", value: data.get(0) } };
                case "number":
                    // TODO: our typed buffers need both length and capacity
                    return { json: { type: "number" }, binary: [new Uint8Array(data.slice())] };
                case "struct":
                    return { json: { type: "struct" } };
            }
        },
        deserialize: ({ json, binary }: { json?: Data, binary: Uint8Array[] }) => {
            throw "not implemented";
        },
    });
}
