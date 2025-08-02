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

import { Data } from "../../data.js";
import { registerTypedBufferCodecs } from "../../typed-buffer/register-typed-buffer-codecs.js";
import { registerTypedArrayCodecs } from "./register-typed-array-codecs.js";

type Codec<T> = {
    name: string;
    predicate: (data: any) => data is T;
    serialize: (data: T) => { json?: any, binary?: Uint8Array[] };
    deserialize: (props: { json?: any, binary: Uint8Array[] }) => T;
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
    binaryIndex: number;
    binaryCount: number;
}

export function isEncodedValue(value: unknown): value is EncodedValue {
    return typeof value === "object" && value !== null && "codec" in value && "binaryIndex" in value && "binaryCount" in value;
}

export function registerCodec<T>(codec: Codec<T>) {
    if (codecs[codec.name]) throw new Error(`codec "${codec.name}" already registered`);
    codecs[codec.name] = codec;
}

registerTypedArrayCodecs();
registerTypedBufferCodecs();

