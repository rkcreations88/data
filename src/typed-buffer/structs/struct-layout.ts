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
export type Layout = "std140" | "packed";
export type StructFieldPrimitiveType = "i32" | "u32" | "f32";

/**
 * Layout for struct fields
 */
export interface StructLayoutField {
    offset: number;
    type: StructFieldPrimitiveType | StructLayout;
}

/**
 * Layout for struct types
 */
export interface StructLayout {
    type: "object" | "array";
    /** Total size including padding in bytes */
    size: number;
    /** Fields for struct types */
    fields: Record<string, StructLayoutField>;
    /** Layout mode used for generating this layout */
    layout?: Layout;
}