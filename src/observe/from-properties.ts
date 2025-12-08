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
import { Notify, Observe } from "./index.js";

/**
 * Creates a new Observe function that combines every named observe function into a single observe function with a value this is an object with the same keys.
 * No result is provided until every required observe function has provided a value. If they all provide a value synchronously, then a result will be provided synchronously.
 */
export function fromProperties<
  T extends { [K: string]: Observe<unknown> },
>(
  observeProperties: T
): Observe<{
  readonly [K in keyof T]: T[K] extends Observe<infer U> ? U : never;
}> {
  type ObservableValues = {
    readonly [K in keyof T]: T[K] extends Observe<infer U> ? U : never;
  };
  return (observer: Notify<ObservableValues>) => {
    const values = new Map<keyof T, T[keyof T]>();
    let initializing = true;
    const maybeNotify = () => {
      if (values.size === Object.keys(observeProperties).length) {
        observer(Object.fromEntries(values) as ObservableValues);
      }
    };

    const unobservers = Object.entries(observeProperties)
      .map(([name, observable]) => {
        return observable((value) => {
          values.set(name as keyof T, value as T[keyof T]);
          if (!initializing) {
            maybeNotify();
          }
        });
      })
      .filter(Boolean);

    initializing = false;
    maybeNotify();

    return () => {
      for (const unobserve of unobservers) {
        unobserve();
      }
    };
  };
}
