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
import { memoizeFactory } from "../../../internal/function/memoize-factory.js";
import type { StructLayout } from "./struct-layout.js";
import type { WriteStruct } from "./write-struct.js";
import { getFieldOffset } from "./get-field-offset.js";

type ViewType = 'f32' | 'i32' | 'u32';
type ViewTypes = Record<ViewType, boolean>;

const generateStructBody = (
    layout: StructLayout,
    parentOffset = '',
    valueRef = 'value',
    indent = '    ',
    usedViews: ViewTypes = { f32: false, i32: false, u32: false }
): [string, ViewTypes] => {
    if (typeof layout === 'string') {
        usedViews[layout as ViewType] = true;
        return [`__${layout}[${parentOffset}] = ${valueRef};`, usedViews];
    }

    const entries = layout.type === 'array' ?
        Object.entries(layout.fields).sort((a, b) => +a[0] - +b[0]) :
        Object.entries(layout.fields);

    let body = '';
    for (const [name, field] of entries) {
        const fieldOffset = getFieldOffset(field, parentOffset);
        const nextValueRef = layout.type === 'array' ? `${valueRef}[${name}]` : `${valueRef}.${name}`;

        if (typeof field.type === 'string') {
            usedViews[field.type as ViewType] = true;
            body += `\n${indent}__${field.type}[${fieldOffset}] = ${nextValueRef};`;
        } else {
            const [nestedBody] = generateStructBody(field.type, fieldOffset, nextValueRef, indent + '    ', usedViews);
            body += `\n${indent}${nestedBody}`;
        }
    }
    return [body, usedViews];
};

export const createWriteStruct = memoizeFactory(<T = unknown>(layout: StructLayout): WriteStruct<T> => {
    const [body, usedViews] = generateStructBody(layout);
    const views = Object.entries(usedViews)
        .filter(([, used]) => used)
        .map(([type]) => `${type}: __${type}`)
        .join(', ');

    const code = `const { ${views} } = data;
index *= ${layout.size / 4};
${body};`;
    return new Function('data', 'index', 'value', code) as WriteStruct<T>;
});
