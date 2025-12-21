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
import { IntersectTuple, StringKeyof } from "../../types/types.js";
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
import { Assert } from "../../types/assert.js";
import { Equal } from "../../types/equal.js";
import type {
  ActionDeclarations,
  ActionFunctions,
  ToActionFunctions,
} from "../store/action-functions.js";

export interface Database<
  C extends Components,
  R extends ResourceComponents,
  A extends ArchetypeComponents<StringKeyof<C & OptionalComponents>>,
  F extends ActionFunctions,
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
    CS extends ComponentSchemas = any,
    RS extends ResourceSchemas = any,
    A extends ArchetypeComponents<string> = any,
    TD extends ActionDeclarations<any, any, any> = any
  > = {
    readonly components: CS;
    readonly resources: RS;
    readonly archetypes: A;
    readonly transactions: TD;
  };

  export namespace Schema {

    export type Intersect<T extends readonly Schema<any, any, any, any>[]> =
      Database.Schema<
        {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<infer C, infer R, infer A, infer TD> ? C : never }>,
        {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, infer R, any, any> ? R : never }>,
        {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, any, infer A, any> ? A : never }>,
        {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, any, any, infer TD> ? TD : never }>
      >

    export function create<
      const CS extends ComponentSchemas,
      const RS extends ResourceSchemas,
      const A extends ArchetypeComponents<StringKeyof<CS & OptionalComponents & Intersect<D>["components"]>>,
      const TD extends ActionDeclarations<any, any, any>,
      const D extends readonly Database.Schema<any, any, any, any>[],
    >(
      schema: {
        components: CS;
        resources: RS;
        archetypes: A;
        transactions: TD;
      },
      dependencies?: D
    ): Intersect<[Database.Schema<CS & Intersect<D>["components"], RS & Intersect<D>["resources"], A, TD>, ...D]> {
      return (dependencies ?? []).reduce((acc, curr) => {
        return {
          components: { ...acc.components, ...curr.components },
          resources: { ...acc.resources, ...curr.resources },
          archetypes: { ...acc.archetypes, ...curr.archetypes },
          transactions: { ...acc.transactions, ...curr.transactions },
        }
      },
        schema
      );
    }
  }

}

// Type tests for Database.Schema.Intersect
type TestSchema1 = Database.Schema<
  { position: { type: "number" } },
  { mousePos: { default: 0 } },
  {},
  {}
>;
type TestSchema2 = Database.Schema<
  { velocity: { type: "number" } },
  { delta: { default: 0 } },
  {},
  {}
>;
type TestSchema3 = Database.Schema<
  { mass: { type: "number" } },
  { gravity: { default: 0 } },
  {},
  {}
>;

type TestIntersect = Database.Schema.Intersect<[TestSchema1, TestSchema2, TestSchema3]>;
type CheckIntersectComponents = Assert<Equal<TestIntersect["components"], {
  position: { type: "number" };
  velocity: { type: "number" };
  mass: { type: "number" };
}>>;
type CheckIntersectResources = Assert<Equal<TestIntersect["resources"], {
  mousePos: { default: 0 };
  delta: { default: 0 };
  gravity: { default: 0 };
}>>;

// Test that archetypes can reference components from dependencies
type BaseSchema = Database.Schema<
  { position: { type: "number" }, health: { type: "number" } },
  {},
  {},
  {}
>;

type ExtendedSchemaResult = ReturnType<typeof Database.Schema.create<
  { velocity: { type: "number" } },
  {},
  { DynamicEntity: ["position", "velocity"], LivingEntity: ["position", "health"] },
  {},
  [BaseSchema]
>>;

type CheckExtendedHasAllComponents = Assert<Equal<ExtendedSchemaResult["components"], {
  position: { type: "number" };
  health: { type: "number" };
  velocity: { type: "number" };
}>>;

type TestTransactionFunctions = ToActionFunctions<{
  test1: (db: Store<any, any>, arg: number) => void;
  test2: (db: Store<any, any>) => void;
}>
