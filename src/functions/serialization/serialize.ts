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
import { findCodec, EncodedValue, getCodec, isEncodedValue } from "./codec.js";

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
            return { codec: codec.name, json, binaryIndex, binaryCount: binary?.length ?? 0 } satisfies EncodedValue;
        }
        return value;
    });
    return { json, binary: allBinaries };
}

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