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
import { ArchetypeId } from "../archetype/index.js";
import { CoreComponents } from "../core-components.js";
import { ResourceComponents } from "../store/resource-components.js";
import { ReadonlyStore, Store } from "../store/index.js";
import { Entity } from "../entity.js";
import { EntityValues } from "../store/core/index.js";
import { Observe } from "../../observe/index.js";
import { TransactionResult } from "./transactional-store/index.js";
import { StringKeyof } from "../../types/types.js";

export type TransactionDeclaration<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
    Input extends any | void = any
> = (db: Store<C, R>, input: Input) => void | Entity

export type TransactionDeclarations<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
> = {
    readonly [name: string]: TransactionDeclaration<C, R>
}

export type AsyncArgsProvider<T> = () => Promise<T> | AsyncGenerator<T>;

/**
 * Converts from TransactionDeclarations to TransactionFunctions by removing the initial database argument.
 */
export type ToTransactionFunctions<T> = {
    [K in keyof T]:
      T[K] extends (db: Store<any, any>, ...rest: infer R) => infer Rtn
        ? R extends []               // only the db param → no args
          ? () => Rtn
          : R extends [infer A]      // db + one extra → widen extra to A | string
            ? (arg: A | AsyncArgsProvider<A>) => Rtn
            : never                  // more than one extra arg – not covered here
        : never;
  };

export type TransactionFunctions = { readonly [K: string]: (args?: any) => void | Entity };

export interface Database<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
    T extends TransactionFunctions = never,
> extends ReadonlyStore<C, R> {
    readonly transactions: T;
    readonly observe: {
        readonly component: { readonly [K in StringKeyof<C>]: Observe<void> };
        readonly resource: { readonly [K in StringKeyof<R>]: Observe<R[K]> };
        readonly transactions: Observe<TransactionResult<C>>;
        entity(id: Entity): Observe<EntityValues<C> | null>;
        archetype(id: ArchetypeId): Observe<void>;
    }
}

type TestTransactionFunctions = ToTransactionFunctions<{
    test1: (db: Store<any, any>, arg: number) => void;
    test2: (db: Store<any, any>) => void;
}>
