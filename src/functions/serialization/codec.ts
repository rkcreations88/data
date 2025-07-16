import { Data } from "../../data.js";
import { registerTypedArrayCodecs } from "./register-typed-array-codecs.js";

type Codec<T> = {
    name: string;
    predicate: (data: any) => data is T;
    serialize: (data: T) => { json?: Data, binary?: Uint8Array[] };
    deserialize: (props: {json?: Data, binary: Uint8Array[] }) => T;
}
const codecs: Record<string, Codec<any>> = {};

export function findCodec(data: any): Codec<any> | null {
    if (typeof data === "object" && data !== null) {
        for (const codec of Object.values(codecs)) {
            if (codec.predicate(data)) {
                return codec;
            }
        }
    }
    return null;
}
export function getCodec(name: string): Codec<any> | null {
    return codecs[name] ?? null;
}

export type EncodedValue = {
    codec: string;
    json?: Data;
    binary: readonly [number, number];
}
export function isEncodedValue(value: any): value is EncodedValue {
    return typeof value === "object" && value !== null && "codec" in value && "binary" in value && Array.isArray(value.binary) && value.binary.length === 2 && typeof value.binary[0] === "number" && typeof value.binary[1] === "number";
}

export function registerCodec<T>(codec: Codec<T>) {
    if (codecs[codec.name]) throw new Error(`codec "${codec.name}" already registered`);
    codecs[codec.name] = codec;
}

registerTypedArrayCodecs();

