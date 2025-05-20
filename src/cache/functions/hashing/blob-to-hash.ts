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
import { bufferToHash } from "./buffer-to-hash.js";

/**
 * Converts a Blob to a hash using the blob content and type using SHA-256.
 */
export async function blobToHash(blob: Blob): Promise<string> {
  const { type } = blob;
  //  create a single buffer to hold both the type and the blob
  const typeByteLength = type.length * 2;
  const buffer = new ArrayBuffer(typeByteLength + blob.size);

  //  write the type into the first part of the buffer
  const charView = new Uint16Array(buffer, 0, type.length);
  for (let i = 0, strLen = type.length; i < strLen; i++) {
    charView[i] = type.charCodeAt(i);
  }
  //  write the blob into the second part of the buffer
  const byteView = new Uint8Array(buffer);
  const blobArrayBuffer = await blob.arrayBuffer();
  byteView.set(new Uint8Array(blobArrayBuffer), typeByteLength);

  //  finally create the hash off the combined buffer
  const hash = await bufferToHash(buffer);
  return hash;
}
