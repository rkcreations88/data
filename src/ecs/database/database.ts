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
import { Archetype, ArchetypeId, ReadonlyArchetype } from "../archetype/index.js";
import { ResourceComponents } from "../store/resource-components.js";
import { ReadonlyStore, Store } from "../store/index.js";
import { Entity } from "../entity.js";
import { EntityReadValues } from "../store/core/index.js";
import { Observe } from "../../observe/index.js";
import { TransactionResult } from "./transactional-store/index.js";
import { StringKeyof } from "../../types/types.js";
import { Components } from "../store/components.js";
import { ArchetypeComponents } from "../store/archetype-components.js";
import { CoreComponents } from "../core-components.js";
import { EntitySelectOptions } from "../store/entity-select-options.js";

export type TransactionDeclaration<
  C extends Components,
  R extends ResourceComponents,
  A extends ArchetypeComponents<StringKeyof<C>>,
  Input extends any | void = any> = (t: Store<C, R, A>, input: Input) => void | Entity
export type TransactionDeclarations = object
export type AsyncArgsProvider<T> = () => Promise<T> | AsyncGenerator<T>;

/**
 * Converts from TransactionDeclarations to TransactionFunctions by removing the initial store argument.
 */
export type ToTransactionFunctions<T> = {
  [K in keyof T]:
  T[K] extends (t: infer S) => infer R
  ? R extends void | Entity
  ? () => R
  : never
  : T[K] extends (t: infer S, input: infer Input) => infer R
  ? R extends void | Entity
  ? (arg: Input | AsyncArgsProvider<Input>) => R
  : never
  : never;
};

export type TransactionFunctions = { readonly [K: string]: (args?: any) => void | Entity };
export interface Database<
  C extends Components = never,
  R extends ResourceComponents = never,
  A extends ArchetypeComponents<StringKeyof<C>> = never,
  T extends TransactionFunctions = never,
> extends ReadonlyStore<C, R, A> {
  readonly transactions: T;
  readonly observe: {
    readonly components: { readonly [K in StringKeyof<C>]: Observe<void> };
    readonly resources: { readonly [K in StringKeyof<R>]: Observe<R[K]> };
    readonly transactions: Observe<TransactionResult<C>>;
    entity<T extends CoreComponents>(id: Entity, minArchetype?: ReadonlyArchetype<T> | Archetype<T>): Observe<{ readonly [K in (StringKeyof<CoreComponents & T>)]: (CoreComponents & T)[K] } & EntityReadValues<C> | null>;
    entity(id: Entity): Observe<EntityReadValues<C> | null>;
    archetype(id: ArchetypeId): Observe<void>;
    select<
      Include extends StringKeyof<C>,
      T extends Include
    >(
      include: readonly Include[] | ReadonlySet<string>,
      options?: EntitySelectOptions<C, Pick<C & CoreComponents, T>>
    ): Observe<readonly Entity[]>;
  }
  toData(): unknown
  fromData(data: unknown): void
}

type TestTransactionFunctions = ToTransactionFunctions<{
  test1: (db: Store<any, any>, arg: number) => void;
  test2: (db: Store<any, any>) => void;
}>
