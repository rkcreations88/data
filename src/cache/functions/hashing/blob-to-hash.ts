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
import { arrayBufferToHex } from "./array-buffer-to-hex.js";
import { bufferToHash } from "./buffer-to-hash.js";

/**
 * Converts a Blob to a hash using the blob content and type using SHA-256.
 */
/**
 * Converts a Blob to a SHA-256 hash.  
 * • Uses the streaming `crypto.DigestStream` API when present (no large buffers).  
 * • Falls back to the original buffer-based approach otherwise.
 */
export async function blobToHash(blob: Blob): Promise<string> {
  // ── 1. Streamed path
  if ("DigestStream" in crypto) {
    const digestStream = new (crypto as any).DigestStream("SHA-256");

    // Encode the MIME-type as UTF-16LE
    const tCodes = new Uint16Array(blob.type.length);
    for (let i = 0; i < blob.type.length; i++) tCodes[i] = blob.type.charCodeAt(i);
    const tBytes = new Uint8Array(tCodes.buffer);

    // Feed type + blob chunks into the hash
    const writer = digestStream.writable.getWriter();
    await writer.write(tBytes);

    const reader = blob.stream().getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      await writer.write(value!);
    }
    await writer.close();

    const hashBuf = await digestStream.digest;
    return arrayBufferToHex(hashBuf);
  }

  // ── 2. Fallback
  const { type } = blob;
  const typeByteLength = type.length * 2;
  const buffer = new ArrayBuffer(typeByteLength + blob.size);

  // Write the MIME-type (UTF-16LE) into the first part of the buffer
  const charView = new Uint16Array(buffer, 0, type.length);
  for (let i = 0; i < type.length; i++) charView[i] = type.charCodeAt(i);

  // Append the blob bytes
  const byteView = new Uint8Array(buffer);
  const blobArrayBuffer = await blob.arrayBuffer();
  byteView.set(new Uint8Array(blobArrayBuffer), typeByteLength);

  // Hash the combined buffer
  return bufferToHash(buffer);
}

