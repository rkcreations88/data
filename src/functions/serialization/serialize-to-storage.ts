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
import { blobStore } from "../../cache/blob-store.js";
import { serializeToBlobs, deserializeFromBlobs } from "./serialize-to-blobs.js";

export const serializeToStorage = async <T>(data: T, id: string, storage: Storage = sessionStorage): Promise<void> => {
    const { json, binary } = await serializeToBlobs(data);
    const [jsonBlobRef, binaryBlobRef] = await Promise.all([
        blobStore.getRef(json),
        blobStore.getRef(binary)
    ]);
    storage.setItem(id, JSON.stringify({ json: jsonBlobRef, binary: binaryBlobRef }));
}

export const deserializeFromStorage = async <T>(id: string, storage: Storage = sessionStorage): Promise<T | null> => {
    const storedData = storage.getItem(id);
    if (!storedData) {
        return null;
    }

    const { json: jsonBlobRef, binary: binaryBlobRef } = JSON.parse(storedData);
    const [jsonBlob, binaryBlob] = await Promise.all([
        blobStore.getBlob(jsonBlobRef),
        blobStore.getBlob(binaryBlobRef)
    ]);

    if (!jsonBlob || !binaryBlob) {
        return null;
    }

    return deserializeFromBlobs({ json: jsonBlob, binary: binaryBlob });
};
