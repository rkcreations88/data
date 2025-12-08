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

import { FromSchema, Schema } from "../schema/index.js";
import { BlobMeta } from "./blob-meta.js";

const BlobHandleSchema = {
    type: 'object',
    properties: {
        ...BlobMeta.schema.properties,
        handle: { type: 'string' },
        expires: { type: 'string' },
        upload: { type: 'boolean' },
        download: { type: 'boolean' },
    },
    required: [...BlobMeta.schema.required, 'handle', 'expires'],
} as const satisfies Schema;

export type BlobHandle = FromSchema<typeof BlobHandleSchema>;
export type UploadHandle = BlobHandle & { upload: true };
export type DownloadHandle = BlobHandle & { download: true };
export namespace BlobHandle {
    export const schema = BlobHandleSchema;
    export function is(value: unknown): value is BlobHandle {
        return (
            typeof value === 'object' &&
            value !== null &&
            'handle' in value &&
            'expires' in value &&
            typeof value.handle === 'string' &&
            typeof value.expires === 'string'
        );
    }
    export function isUpload(value: unknown): value is UploadHandle {
        return is(value) && 'upload' in value && value.upload === true;
    }
    export function isDownload(value: unknown): value is DownloadHandle {
        return is(value) && 'download' in value && value.download === true;
    }
}