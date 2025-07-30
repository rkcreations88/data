import { getCodec, isEncodedValue } from "./codec.js";

export function deserialize<T>(payload: { json: string, binary: Uint8Array[] }): T {
    const data = JSON.parse(payload.json, (_key, value) => {
        if (isEncodedValue(value)) {
            const codec = getCodec(value.codec);
            if (codec) {
                const binary = payload.binary.slice(value.binaryIndex, value.binaryIndex + value.binaryCount);
                return codec.deserialize({ json: value.json, binary });
            }
        }
        return value;
    });
    return data as T;
}