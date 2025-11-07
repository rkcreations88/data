/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/
import { serialize, deserialize } from "./serialize.js";

export const serializeToBlobs = async <T>(data: T): Promise<{ json: Blob, binary: Blob }> => {
    const serialized = serialize(data);
    const binarySizes = serialized.binary.map((array) => array.byteLength);
    const json = new Blob([JSON.stringify({ json: serialized.json, binarySizes })], { type: "application/json" });
    const binary = new Blob(serialized.binary as BlobPart[], { type: "application/octet-stream" });
    return { json, binary };
}

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