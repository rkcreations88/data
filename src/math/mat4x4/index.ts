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

import { FromSchema } from "../../schema/index.js";
import { schema } from "./schema.js";

export type Mat4x4 = FromSchema<typeof schema>;

/**
 * 4x4 Matrix operations using column-major order (WebGPU standard).
 * 
 * Matrix Layout:
 * Matrices are stored in column-major order as flat arrays of 16 elements.
 * This matches WebGPU's memory layout and shader expectations.
 * 
 * Layout: [m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15]
 * 
 * Which represents:
 * ┌                    ┐
 * │ m0  m4  m8   m12  │  (Column 0, 1, 2, 3)
 * │ m1  m5  m9   m13  │
 * │ m2  m6  m10  m14  │
 * │ m3  m7  m11  m15  │
 * └                    ┘
 * 
 * For transformation matrices (position, rotation, scale):
 * - Columns 0-2 (m0-m2, m4-m6, m8-m10): Rotation/scale basis vectors (right, up, forward)
 * - Column 3 (m12, m13, m14): Translation (x, y, z)
 * - Row 3 (m3, m7, m11, m15): Perspective (usually 0, 0, 0, 1)
 */
export * as Mat4x4 from "./public.js";
