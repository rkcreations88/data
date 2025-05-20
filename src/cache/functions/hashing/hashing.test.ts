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
import { blobToHash } from "./blob-to-hash.js";
import { jsonToHash } from "./json-to-hash.js";
import { describe, expect, it } from "vitest";

describe("test hashing", () => {
  it("blobToHash should avoid collisions based on content and type", async () => {
    const blobs = [
      new Blob([
        new Uint8Array([
          45, 255, 128, 0, 1, 33, 33, 85, 129, 250, 245, 12, 33, 89, 7,
        ]),
      ]),
      new Blob([
        new Uint8Array([
          45, 255, 128, 0, 1, 33, 33, 85, 129, 250, 245, 12, 33, 89, 8,
        ]),
      ]),
      new Blob(["long text sample here"]),
      new Blob(["long text sample here."]),
      new Blob(["a"]),
      new Blob(["b"]),
      new Blob(["a"], { type: "octet/binary" }),
      new Blob(["a"], { type: "text/plain" }),
      //    empty blobs should work
      new Blob([""]),
      new Blob([""], { type: "octet/binary" }),
      new Blob([""], { type: "text/plain" }),
    ];
    const hashPromises = blobs.map((blob) => blobToHash(blob));
    const hashes = await Promise.all(hashPromises);
    const unique = new Set(hashes);
    const collisions = hashes.length - unique.size;
    expect(collisions).toBe(0);
  });
  it("blobToHash should generate consistent hashes", async () => {
    const blobs = [
      new Blob(["long text sample here"], { type: "text/plain" }),
      new Blob(["long text sample here"], { type: "text/plain" }),
      new Blob(["long text sample here"], { type: "text/plain" }),
    ];
    const hashPromises = blobs.map((blob) => blobToHash(blob));
    const hashes = await Promise.all(hashPromises);
    const unique = new Set(hashes);
    expect(unique.size).toBe(1);
  });
  it("jsonToHash should avoid collisions", async () => {
    const values = [
      "foo",
      { a: 1 },
      {},
      [],
      { a: 2 },
      null,
      "",
      { alpha: "bravo" },
    ];
    const hashPromises = values.map((value) => jsonToHash(value));
    const hashes = await Promise.all(hashPromises);
    const unique = new Set(hashes);
    const collisions = hashes.length - unique.size;
    expect(collisions).toBe(0);
  });
  it("jsonToHash should generate consistent hashes", async () => {
    const values = [
      { a: 1, b: 2, foo: "bar" },
      { a: 1, b: 2, foo: "bar" },
      { a: 1, b: 2, foo: "bar" },
    ];
    const hashPromises = values.map((value) => jsonToHash(value));
    const hashes = await Promise.all(hashPromises);
    const unique = new Set(hashes);
    expect(unique.size).toBe(1);
  });
});
