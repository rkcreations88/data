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
import { CoreComponents } from "../core-components.js";
import { ResourceComponents } from "./resource-components.js";
import { Core, ReadonlyCore } from "./core/core.js";
import { Entity } from "../entity.js";
import { Simplify, StringKeyof } from "../../types/types.js";
import { Components } from "./components.js";
import { ArchetypeComponents } from "./archetype-components.js";
import { Archetype, ReadonlyArchetype } from "../archetype/archetype.js";
import { EntitySelectOptions } from "./entity-select-options.js";
import { Undoable } from "../database/undoable.js";
import { Assert } from "../../types/assert.js";
import { Equal } from "../../types/equal.js";
import { FromSchemas } from "../../schema/schema.js";
import { ComponentSchemas } from "../component-schemas.js";
import { ResourceSchemas } from "../resource-schemas.js";
import { createStore } from "./create-store.js";

interface BaseStore<C extends object = never> {
    select<
        Include extends StringKeyof<C>
    >(
        include: readonly Include[] | ReadonlySet<string>,
        options?: EntitySelectOptions<C, Pick<C & CoreComponents, Include>>
    ): readonly Entity[];
    toData(): unknown
}

export interface ReadonlyStore<
    C extends Components = never,
    R extends ResourceComponents = never,
    A extends ArchetypeComponents<StringKeyof<C>> = never,
> extends BaseStore<C>, ReadonlyCore<C> {
    readonly resources: { readonly [K in StringKeyof<R>]: R[K] };
    readonly archetypes: { -readonly [K in StringKeyof<A>]: ReadonlyArchetype<CoreComponents & { [P in A[K][number]]: C[P] }> }
}

export type ToReadonlyStore<T extends Store<any, any>> = T extends Store<infer C, infer R> ? ReadonlyStore<C, R> : never;

/**
 * Store is the main interface for storing components, entities and resources.
 */
export interface Store<
    C extends Components = never,
    R extends ResourceComponents = never,
    A extends ArchetypeComponents<StringKeyof<C>> = never,
> extends BaseStore<C>, Core<C> {
    /**
     * This is used when a store is used to represent a transaction.
     * For most stores, this is ignored if it is set.
     */
    undoable?: Undoable;
    readonly resources: { -readonly [K in StringKeyof<R>]: R[K] };
    readonly archetypes: { -readonly [K in StringKeyof<A>]: Archetype<CoreComponents & { [P in A[K][number]]: C[P] }> }
    fromData(data: unknown): void
}

export namespace Store {
    export type Components<S extends Store<any, any, any>> = S extends Store<infer C, infer R, infer A> ? C & R & A : never;
    export type Resources<S extends Store<any, any, any>> = S extends Store<any, infer R, any> ? R : never;
    export type Archetypes<S extends Store<any, any, any>> = S extends Store<any, any, infer A> ? A : never;
    export type EntityValues<S extends Store<any, any, any>, K extends S extends Store<any, any, infer A> ? StringKeyof<A> : never> = Simplify<Parameters<S["archetypes"][K]["insert"]>[0] & CoreComponents>;
    export type InsertValues<S extends Store<any, any, any>, K extends S extends Store<any, any, infer A> ? StringKeyof<A> : never> = Parameters<S["archetypes"][K]["insert"]>[0];

    export type Schema<
        CS extends ComponentSchemas,
        RS extends ResourceSchemas,
        A extends ArchetypeComponents<StringKeyof<CS>>,
    > = {
        readonly components: CS;
        readonly resources: RS;
        readonly archetypes: A;
    };

    export type FromSchema<T> = T extends Store.Schema<infer CS, infer RS, infer A> ? Store<FromSchemas<CS>, FromSchemas<RS>, A> : never;

    export namespace Schema {
        export function create<
            const CS extends ComponentSchemas,
            const RS extends ResourceSchemas,
            const A extends ArchetypeComponents<StringKeyof<CS>>,
        >(
            components: CS,
            resources: RS,
            archetypes: A,
        ) {
            return { components, resources, archetypes } as const satisfies Store.Schema<CS, RS, A>;
        };

    }

    export function createFromSchema<
        const CS extends ComponentSchemas,
        const RS extends ResourceSchemas,
        const A extends ArchetypeComponents<StringKeyof<CS>>,
    >(
        schema: Store.Schema<CS, RS, A>,
    ) {
        return createStore(schema.components, schema.resources, schema.archetypes);
    };
}

type Foo = Store<{ a: number, b: string }, {}, { one: ["a", "b"] }>
type CheckEntityValues = Assert<Equal<Store.EntityValues<Foo, "one">, {
    id: number;
    a: number;
    b: string;
}>>;
type CheckInsertValues = Assert<Equal<Store.InsertValues<Foo, "one">, {
    a: number;
    b: string;
}>>;

type CheckStoreFromSchema = Store.FromSchema<Store.Schema<{
    velocity: { type: "number" },
    particle: { type: "boolean" },
}, {
    mousePosition: { type: "number", default: 0 },
    fooPosition: { type: "number", default: 0 },
}, {
    Particle: ["particle"],
    DynamicParticle: ["particle", "velocity"],
}>>;
declare const testStore: CheckStoreFromSchema;
type CheckDynamicParticle = Assert<Equal<typeof testStore.archetypes.DynamicParticle, Archetype<CoreComponents & {
    particle: boolean;
    velocity: number;
}>>>;
type CheckParticle = Assert<Equal<typeof testStore.archetypes.Particle, Archetype<CoreComponents & {
    particle: boolean;
}>>>;
