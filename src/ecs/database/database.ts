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
import { RequiredComponents } from "../required-components.js";
import { EntitySelectOptions } from "../store/entity-select-options.js";
import { Service } from "../../service/service.js";
import { OptionalComponents } from "../optional-components.js";
import { createDatabase } from "./public/create-database.js";
import { ResourceSchemas } from "../resource-schemas.js";
import { ComponentSchemas } from "../component-schemas.js";
import { FromSchemas } from "../../schema/index.js";
import type {
  ActionDeclarations,
  ActionFunctions,
  ToActionFunctions,
} from "../store/action-functions.js";

export interface Database<
  C extends Components = never,
  R extends ResourceComponents = never,
  A extends ArchetypeComponents<StringKeyof<C & OptionalComponents>> = never,
  F extends ActionFunctions = never,
> extends ReadonlyStore<C, R, A>, Service {
  readonly transactions: F & Service;
  /**
   * Provides direct mutable access to the underlying store.
   */
  readonly store: Store<C, R, A> & {
    /**
     * Provides fast access to the action functions without a transaction wrapper.
     * This means any calls to them will NOT be observable or undoable.
     */
    readonly actions: F;
  }
  readonly observe: {
    readonly components: { readonly [K in StringKeyof<C>]: Observe<void> };
    readonly resources: { readonly [K in StringKeyof<R>]: Observe<R[K]> };
    readonly transactions: Observe<TransactionResult<C>>;
    entity<T extends RequiredComponents>(id: Entity, minArchetype?: ReadonlyArchetype<T> | Archetype<T>): Observe<{ readonly [K in (StringKeyof<RequiredComponents & T>)]: (RequiredComponents & T)[K] } & EntityReadValues<C> | null>;
    entity(id: Entity): Observe<EntityReadValues<C> | null>;
    archetype(id: ArchetypeId): Observe<void>;
    select<
      Include extends StringKeyof<C>,
      T extends Include
    >(
      include: readonly Include[] | ReadonlySet<string>,
      options?: EntitySelectOptions<C, Pick<C & RequiredComponents, T>>
    ): Observe<readonly Entity[]>;
  }
  toData(): unknown
  fromData(data: unknown): void
  extend<S extends Database.Schema<any, any, any, any>>(schema: S): Database<
    C & (S extends Database.Schema<infer XC, infer XR, infer XA, infer XTD> ? FromSchemas<XC> : never),
    R & (S extends Database.Schema<infer XC, infer XR, infer XA, infer XTD> ? FromSchemas<XR> : never),
    A & (S extends Database.Schema<infer XC, infer XR, infer XA, infer XTD> ? XA : never),
    F & (S extends Database.Schema<infer XC, infer XR, infer XA, infer XTD> ? ToActionFunctions<XTD> : never)
  >;
}

export namespace Database {
  export const create = createDatabase;

  export type Schema<
    CS extends ComponentSchemas,
    RS extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<CS>>,
    TD extends ActionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>
  > = {
    readonly components: CS;
    readonly resources: RS;
    readonly archetypes: A;
    readonly transactions: TD;
  };

  export namespace Schema {
    export function create<
      const CS extends ComponentSchemas,
      const RS extends ResourceSchemas,
      const A extends ArchetypeComponents<StringKeyof<CS>>,
      const TD extends ActionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>
    >(
      storeSchema: Store.Schema<CS, RS, A>,
      transactions: TD,
    ) {
      return { ...storeSchema, transactions } as const satisfies Database.Schema<CS, RS, A, TD>;
    }
  }

}

type TestTransactionFunctions = ToActionFunctions<{
  test1: (db: Store<any, any>, arg: number) => void;
  test2: (db: Store<any, any>) => void;
}>
