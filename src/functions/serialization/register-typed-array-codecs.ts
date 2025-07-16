import { Data } from "../../data.js";
import { registerCodec } from "./codec.js";

export function registerTypedArrayCodecs() {
    // Built in support for all 32-bit typed arrays and float64 arrays
    for (const typedArrayConstructor of [Float32Array, Int32Array, Uint32Array, Float64Array]) {
        registerCodec<any>({
            name: typedArrayConstructor.name,
            predicate: (data: any): data is any => data instanceof typedArrayConstructor,
            serialize: (data: any) => ({ binary: [new Uint8Array(data.buffer, data.byteOffset, data.byteLength)] }),
            deserialize: ({ binary }: { json?: Data, binary: Uint8Array[] }) => new (typedArrayConstructor as any)(binary[0].buffer, binary[0].byteOffset, binary[0].byteLength / typedArrayConstructor.BYTES_PER_ELEMENT),
        });
    }
}
