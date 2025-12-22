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

import { FromSchemas } from "../../schema/index.js";
import { IntersectTuple, NoInfer, StringKeyof } from "../../types/types.js";
import { ArchetypeComponents, ComponentSchemas, Components, Database, OptionalComponents, ResourceComponents, ResourceSchemas } from "../index.js";
import { ActionDeclarations, ActionFunctions, ToActionFunctions } from "../store/action-functions.js";
import { Assert } from "../../types/assert.js";
import { Equal } from "../../types/equal.js";
import { createWorld } from "./create-world.js";

type SystemFunction = () => void | Promise<void>;
export interface World<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C & OptionalComponents>>,
    F extends ActionFunctions,
    SystemNames extends string,
> {

    readonly database: Database<C, R, A, F>;
    readonly system: {
        functions: { readonly [K in SystemNames]: SystemFunction };
        order: SystemNames[][];
    }

    extend<S extends World.Schema<any, any, any, any, any>>(schema: S): World<
        C & (S extends World.Schema<infer XC, any, any, any, any> ? FromSchemas<XC> : never),
        R & (S extends World.Schema<any, infer XR, any, any, any> ? FromSchemas<XR> : never),
        A & (S extends World.Schema<any, any, infer XA, any, any> ? XA : never),
        F & (S extends World.Schema<any, any, any, infer XF, any> ? XF : never),
        SystemNames & (S extends World.Schema<any, any, any, any, infer XS> ? XS : never)
    >;

}

export namespace World {

    export const create = createWorld;

    export interface Schema<
        C extends ComponentSchemas = any,
        R extends ResourceSchemas = any,
        A extends ArchetypeComponents<StringKeyof<C>> = any,
        T extends ActionDeclarations<FromSchemas<C>, FromSchemas<R>, A> = any,
        S extends string = any,
    > {
        components: C;
        resources: R;
        archetypes: A;
        transactions: T;
        systems: { readonly [K in S]: {
            readonly create: (world: World<FromSchemas<C>, FromSchemas<R>, A, ToActionFunctions<T>, S>) => SystemFunction;
            readonly schedule?: {
                readonly before?: readonly NoInfer<Exclude<S, K>>[];
                readonly after?: readonly NoInfer<Exclude<S, K>>[];
            }
        } };
    }

    export namespace Schema {

        export type Intersect<T extends readonly Schema<any, any, any, any, any>[]> =
            World.Schema<
                {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<infer C, any, any, any, any> ? C : never }>,
                {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, infer R, any, any, any> ? R : never }>,
                {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, any, infer A, any, any> ? A : never }>,
                {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, any, any, infer TD, any> ? TD : never }>,
                Extract<{ [K in keyof T]: T[K] extends Schema<any, any, any, any, infer S> ? S : never }[number], string>
            >

        /**
         * Creates a World schema with optional properties. All schema properties
         * (components, resources, archetypes, transactions, systems) are optional
         * and default to empty objects when not provided.
         * 
         * @param schema - Partial world schema. Omit any properties you don't need.
         * @param dependencies - Optional array of schemas to merge with. Properties from
         *                       dependencies are merged with the schema, with schema properties
         *                       taking precedence.
         * @returns The merged schema with all properties from the schema and dependencies
         * 
         * @example
         * ```typescript
         * // Minimal schema with only systems
         * const schema = World.Schema.create({
         *   systems: {
         *     renderSystem: {
         *       create: (world) => () => {
         *         // Access database
         *         const entities = world.database.select(["position"]);
         *         world.database.transactions.updatePositions();
         *         
         *         // Access other systems
         *         world.system.functions.physicsSystem();
         *         
         *         // Check execution order
         *         console.log(world.system.order);
         *       }
         *     }
         *   }
         * });
         * 
         * // Schema with dependencies
         * const extended = World.Schema.create({
         *   components: { velocity: { type: "number" } }
         * }, [baseSchema]);
         * ```
         */
        export function create<
            const C extends ComponentSchemas = {},
            const R extends ResourceSchemas = {},
            const A extends ArchetypeComponents<StringKeyof<C & Intersect<D>["components"]>> = {},
            const T extends ActionDeclarations<FromSchemas<C & Intersect<D>["components"]>, FromSchemas<R & Intersect<D>["resources"]>, A> = {},
            const S extends string = never,
            const D extends readonly World.Schema<any, any, any, any, any>[] = [],
        >(
            schema: Partial<World.Schema<C, R, A, T, S>>,
            dependencies?: D
        ): Intersect<[World.Schema<C, R, A, T, S>, ...D]> {
            const { components = {}, resources = {}, archetypes = {}, transactions = {}, systems = {} } = schema;
            return (dependencies ?? []).reduce((acc, curr) => {
                return {
                    components: { ...acc.components, ...curr.components },
                    resources: { ...acc.resources, ...curr.resources },
                    archetypes: { ...acc.archetypes, ...curr.archetypes },
                    transactions: { ...acc.transactions, ...curr.transactions },
                    systems: { ...acc.systems, ...curr.systems },
                } as any;
            }, { components, resources, archetypes, transactions, systems } as any) as any;
        }

    }
}

// Type tests for World.Schema.Intersect
type TestWorldSchema1 = World.Schema<
    { position: { type: "number" } },
    { mousePos: { default: 0 } },
    {},
    {},
    "renderSystem"
>;
type TestWorldSchema2 = World.Schema<
    { velocity: { type: "number" } },
    { delta: { default: 0 } },
    {},
    {},
    "physicsSystem"
>;
type TestWorldSchema3 = World.Schema<
    { mass: { type: "number" } },
    { gravity: { default: 0 } },
    {},
    {},
    "gravitySystem"
>;

type TestWorldIntersect = World.Schema.Intersect<[TestWorldSchema1, TestWorldSchema2, TestWorldSchema3]>;
type CheckWorldIntersectComponents = Assert<Equal<TestWorldIntersect["components"], {
    position: { type: "number" };
    velocity: { type: "number" };
    mass: { type: "number" };
}>>;
type CheckWorldIntersectResources = Assert<Equal<TestWorldIntersect["resources"], {
    mousePos: { default: 0 };
    delta: { default: 0 };
    gravity: { default: 0 };
}>>;
