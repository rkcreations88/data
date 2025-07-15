import { Data } from "../data.js";

type Codec<T> = {
    name: string;
    predicate: (data: any) => data is T;
    serialize: (data: T) => { json?: Data, binary?: Uint8Array[] };
    deserialize: (props: {json?: Data, binary: Uint8Array[] }) => T;
}
function findCodec(data: any): Codec<any> | null {
    if (typeof data === "object" && data !== null) {
        for (const codec of Object.values(codecs)) {
            if (codec.predicate(data)) {
                return codec;
            }
        }
    }
    return null;
}

type EncodedValue = {
    codec: string;
    json?: Data;
    binary: readonly [number, number];
}
function isEncodedValue(value: any): value is EncodedValue {
    return typeof value === "object" && value !== null && "codec" in value && "binary" in value && Array.isArray(value.binary) && value.binary.length === 2 && typeof value.binary[0] === "number" && typeof value.binary[1] === "number";
}

const codecs: Record<string, Codec<any>> = {};
export function registerCodec<T>(codec: Codec<T>) {
    if (codecs[codec.name]) throw new Error(`codec "${codec.name}" already registered`);
    codecs[codec.name] = codec;
}

export function serialize<T>(data: T): { json: string, binary: Uint8Array[] } {
    const allBinaries: Uint8Array[] = [];
    const json = JSON.stringify(data, (_key, value) => {
        const codec = findCodec(value);
        if (codec) {
            const { json, binary } = codec.serialize(value);
            const binaryIndex = allBinaries.length;
            if (binary) {
                allBinaries.push(...binary);
            }
            return { codec: codec.name, json, binary: [binaryIndex, binary?.length ?? 0] } satisfies EncodedValue;
        }
        return value;
    });
    return { json, binary: allBinaries };
}

export function deserialize<T>(payload: { json: string, binary: Uint8Array[] }): T {
    const data = JSON.parse(payload.json, (_key, value) => {
        if (isEncodedValue(value)) {
            const codec = codecs[value.codec];
            if (codec) {
                const binary = payload.binary.slice(value.binary[0], value.binary[0] + value.binary[1]);
                return codec.deserialize({ json: value.json, binary });
            }
        }
        return value;
    });
    return data as T;
}

// Built in support for all 32-bit typed arrays and float64 arrays
for (const typedArrayConstructor of [Float32Array, Int32Array, Uint32Array, Float64Array]) {
    registerCodec<any>({
        name: typedArrayConstructor.name,
        predicate: (data: any): data is any => data instanceof typedArrayConstructor,
        serialize: (data: any) => ({ binary: [new Uint8Array(data.buffer, data.byteOffset, data.byteLength)] }),
        deserialize: ({ binary }: { json?: Data, binary: Uint8Array[] }) => new (typedArrayConstructor as any)(binary[0].buffer, binary[0].byteOffset, binary[0].byteLength / typedArrayConstructor.BYTES_PER_ELEMENT),
    });
}
