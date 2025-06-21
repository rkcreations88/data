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

/**
 * Data is readonly JSON.
 * This type forms the foundation for all of our internal state models and interfaces to external APIs.
 * It is easy to serialize/deserialize/compare/hash/cache and validate (with JSON-Schema).
 * These traits make it an ideal foundation for building a robust state engine which cannot enter into invalid states.
 * It also allows us to strongly define contracts between our application and external services.
 * Validation of input arguments and output results allows strict enforcement of agreed upon contracts.
 */
export type Data =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<Data>
  | { readonly [K in string]?: Data };
