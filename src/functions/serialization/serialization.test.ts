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

import { describe, it, expect } from 'vitest';
import { serialize, deserialize } from './serialize.js';
import { createTypedBuffer } from '../../typed-buffer/create-typed-buffer.js';
import { equals } from '../../equals.js';
import { createTable } from '../../table/create-table.js';
import { addRow } from '../../table/add-row.js';


describe('serialize/deserialize', () => {
  it('round-trips objects with typed arrays', () => {
    const original = {
      a: 1,
      b: new Int32Array([1, 2, 3]),
      nested: {
        c: 3,
        d: new Uint32Array([4, 5]),
      },
      e: new Float32Array([1.5, 2.5, 3.5]),
      d: [new Uint32Array([1])],
      f: new Float64Array([5.5, 6.5, 7.5]),
    };
    const payload = serialize(original);
    expect(payload.json).toBeTypeOf('string');
    expect(payload.binary).toBeInstanceOf(Array);
    const roundTrip = deserialize<typeof original>(payload);
    expect(roundTrip).toEqual(original);
  });
  it('round-trips typed buffers', () => {
    const original = {
      a: createTypedBuffer({ type: "number", precision: 1 }, [3, 2, 1]),
      b: createTypedBuffer({ const: true }, 2),
      c: createTypedBuffer({ type: "object", properties: { x: { type: "number", precision: 1 }, y: { type: "number", precision: 1 } }, required: ["x", "y"], additionalProperties: false }, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]),
      d: createTypedBuffer({ type: "object", properties: { name: { type: "string" }, age: { type: "integer" } }, required: ["name", "age"], additionalProperties: false }, [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ]),
    };
    // console.log(original);
    const payload = serialize(original);
    const roundTrip = deserialize<typeof original>(payload);
    expect(equals(roundTrip, original)).toBe(true);
  });
  // round tripping will not work with array-buffer because values are undefined originally and null on round trip
  // it('round-trips typed-buffers with strings', () => {
  //   const original = createTypedBuffer({ type: "string" });
  //   original.set(0, "Hello");
  //   original.set(1, "World");
  //   original.capacity = 4;
  //   const payload = serialize(original);
  //   const roundTrip = deserialize<typeof original>(payload);
  // });
  it('round-trips tables', () => {
    const table = createTable({
      id: { type: "integer" },
      age: { type: "integer" },
    });
    addRow(table, { id: 1, age: 30 });
    addRow(table, { id: 2, age: 25 });
    const payload = serialize(table);
    const roundTrip = deserialize<typeof table>(payload);
    expect(equals(roundTrip, table)).toBe(true);
  });
}); 