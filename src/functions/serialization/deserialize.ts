import { getCodec, isEncodedValue } from "./codec.js";

export function deserialize<T>(payload: { json: string, binary: Uint8Array[] }): T {
    const data = JSON.parse(payload.json, (_key, value) => {
        if (isEncodedValue(value)) {
            const codec = getCodec(value.codec);
            if (codec) {
                const binary = payload.binary.slice(value.binary[0], value.binary[0] + value.binary[1]);
                return codec.deserialize({ json: value.json, binary });
            }
        }
        return value;
    });
    return data as T;
}