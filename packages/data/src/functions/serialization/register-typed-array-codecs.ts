// © 2026 Adobe. MIT License. See /LICENSE for details.
import { Data } from "../../data.js";
import { registerCodec } from "./codec.js";

export function registerTypedArrayCodecs() {
    // Support for all typed arrays
    const typedArrayConstructors = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array
    ];

    for (const typedArrayConstructor of typedArrayConstructors) {
        registerCodec<any>({
            name: typedArrayConstructor.name,
            predicate: (data: any): data is any => data instanceof typedArrayConstructor,
            serialize: (data: any) => {
                const view = new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);
                return { binary: [typeof SharedArrayBuffer !== "undefined" && data.buffer instanceof SharedArrayBuffer ? view.slice() : view] };
            },
            deserialize: ({ binary }: { json?: Data, binary: Uint8Array<ArrayBuffer>[] }) => new (typedArrayConstructor as any)(binary[0].buffer, binary[0].byteOffset, binary[0].byteLength / typedArrayConstructor.BYTES_PER_ELEMENT),
        });
    }
}
