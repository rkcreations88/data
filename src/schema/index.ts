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

import type { Schema as SchemaType, FromSchema as FromSchemaType, FromSchemas as FromSchemasType, Layout, Conditional, UIProperties, JSONPath, JSONMergePatch, FromSchemaInternal } from "./schema.js";

export type Schema = SchemaType;
export type FromSchema<T, Depth extends number = 5> = FromSchemaType<T, Depth>;
export type FromSchemas<T> = FromSchemasType<T>;
export type { Layout, Conditional, UIProperties, JSONPath, JSONMergePatch, FromSchemaInternal };
export * as Schema from "./public.js";
export type { getDynamicSchema } from "./dynamic/index.js";
export * from "./validation/index.js";
export * from "../math/f32/index.js";
export * from "../math/i32/index.js";
export * from "../math/u32/index.js";
export * from "./true/index.js";
export { True } from "./true/index.js";
export * from "./boolean/index.js";
export { Boolean } from "./boolean/index.js";
export * from "./time/index.js";
export { Time } from "./time/index.js";
