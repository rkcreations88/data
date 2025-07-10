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

import { Table } from "./table.js";

/**
 * Copies a column from an array of tables to a GPU buffer.
 */
export const copyColumnToGPUBuffer = <T extends Table<any>, K extends keyof T["columns"]>(
    tables: readonly T[],
    columnName: K,
    device: GPUDevice,
    gpuBuffer: GPUBuffer,
): GPUBuffer => {
    // get total byte length
    let totalByteLength = 0;
    for (const table of tables) {
        totalByteLength += table.rows * table.columns[columnName].typedArrayElementSizeInBytes;
    }
    // ensure the gpu buffer is large enough
    if (gpuBuffer.size < totalByteLength) {
        gpuBuffer.destroy();
        gpuBuffer = device.createBuffer({ size: totalByteLength, usage: gpuBuffer.usage });
    }
    // copy all columns to the gpu buffer while incrementing the offset
    let offset = 0;
    for (const table of tables) {
        const column = table.columns[columnName];
        const writeByteLength = table.rows * column.typedArrayElementSizeInBytes;
        const array = column.getTypedArray();
        device.queue.writeBuffer(gpuBuffer, offset, array.buffer, 0, writeByteLength);
        offset += writeByteLength;
    }
    return gpuBuffer;
}