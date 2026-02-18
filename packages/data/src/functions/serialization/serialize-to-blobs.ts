// © 2026 Adobe. MIT License. See /LICENSE for details.
import { serialize, deserialize } from "./serialize.js";

export const serializeToBlobs = async <T>(data: T): Promise<{ json: Blob, binary: Blob }> => {
    const serialized = serialize(data);
    // copy SharedArrayBuffer -> ArrayBuffer, leave ArrayBuffer as-is.
    const normalizedBinary: BlobPart[] = serialized.binary.map((arr) => {
        if (typeof SharedArrayBuffer !== "undefined" && arr instanceof SharedArrayBuffer) {
            return new Uint8Array(arr).slice().buffer;
        }
        return arr as BlobPart;
    });

    const binarySizes = serialized.binary.map((array) => array.byteLength);
    const json = new Blob([JSON.stringify({ json: serialized.json, binarySizes })], { type: "application/json" });
    const binary = new Blob(normalizedBinary, { type: "application/octet-stream" });

    return { json, binary };
};

export const deserializeFromBlobs = async <T>({ json, binary }: { json: Blob, binary: Blob }): Promise<T> => {
    const jsonText = await json.text();
    const { json: serializedJson, binarySizes } = JSON.parse(jsonText);

    const binaryArray = new Uint8Array(await binary.arrayBuffer());
    const binaryChunks: Uint8Array[] = [];
    let offset = 0;

    for (const size of binarySizes) {
        binaryChunks.push(binaryArray.slice(offset, offset + size));
        offset += size;
    }

    return deserialize<T>({ json: serializedJson, binary: binaryChunks });
};