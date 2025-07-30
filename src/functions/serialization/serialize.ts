import { findCodec, EncodedValue } from "./codec.js";

export function serialize<T>(data: T): { json: string, binary: Uint8Array[] } {
    const allBinaries: Uint8Array[] = [];
    const json = JSON.stringify(data, (_key, value) => {
        const codec = findCodec(value);
        if (codec) {
            const { json, binary } = codec.serialize(value);
            console.log("serialize", {json, binary});
            const binaryIndex = allBinaries.length;
            if (binary) {
                allBinaries.push(...binary);
            }
            return { codec: codec.name, json, binaryIndex, binaryCount: binary?.length ?? 0 } satisfies EncodedValue;
        }
        return value;
    });
    return { json, binary: allBinaries };
}
