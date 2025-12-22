import { FromSchemas } from "../../schema/index.js";
import { IntersectTuple, NoInfer, StringKeyof } from "../../types/types.js";
import { ArchetypeComponents, ComponentSchemas, Components, Database, OptionalComponents, ResourceComponents, ResourceSchemas } from "../index.js";
import { ActionDeclarations, ActionFunctions, ToActionFunctions } from "../store/action-functions.js";
import { Assert } from "../../types/assert.js";
import { Equal } from "../../types/equal.js";

type SystemFunction = () => void | Promise<void>;

export interface World<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C & OptionalComponents>>,
    F extends ActionFunctions,
> {

    readonly database: Database<C, R, A, F>;

    extend<S extends World.Schema<any, any, any, any, any>>(schema: S): World<
        C & (S extends World.Schema<infer XC, any, any, any, any> ? FromSchemas<XC> : never),
        R & (S extends World.Schema<any, infer XR, any, any, any> ? FromSchemas<XR> : never),
        A & (S extends World.Schema<any, any, infer XA, any, any> ? XA : never),
        F & (S extends World.Schema<any, any, any, infer XF, any> ? XF : never)
    >;

}

export namespace World {

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
            readonly create: (db: Database<FromSchemas<C>, FromSchemas<R>, A, ToActionFunctions<T>>) => SystemFunction;
            readonly schedule?: {
                readonly before?: readonly NoInfer<Exclude<S, K>>[];
                readonly after?: readonly NoInfer<Exclude<S, K>>[];
            }
        } };
    }

    export namespace Schema {

        export type Intersect<T extends readonly Schema<any, any, any, any, any>[]> =
            World.Schema<
                {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<infer C, infer R, infer A, infer TD, infer S> ? C : never }>,
                {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, infer R, any, any, any> ? R : never }>,
                {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, any, infer A, any, any> ? A : never }>,
                {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, any, any, infer TD, any> ? TD : never }>,
                Extract<{ [K in keyof T]: T[K] extends Schema<any, any, any, any, infer S> ? S : never }[number], string>
            >

        export function create<
            const C extends ComponentSchemas,
            const R extends ResourceSchemas,
            const A extends ArchetypeComponents<StringKeyof<C & Intersect<D>["components"]>>,
            const T extends ActionDeclarations<FromSchemas<C & Intersect<D>["components"]>, FromSchemas<R & Intersect<D>["resources"]>, A>,
            const S extends string,
            const D extends readonly World.Schema<any, any, any, any, any>[],
        >(
            schema: World.Schema<C, R, A, T, S>,
            dependencies?: D
        ): Intersect<[World.Schema<C, R, A, T, S>, ...D]> {
            return (dependencies ?? []).reduce((acc, curr) => {
                return {
                    components: { ...acc.components, ...curr.components },
                    resources: { ...acc.resources, ...curr.resources },
                    archetypes: { ...acc.archetypes, ...curr.archetypes },
                    transactions: { ...acc.transactions, ...curr.transactions },
                    systems: { ...acc.systems, ...curr.systems },
                } as any;
            }, schema as any) as any;
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
// type CheckWorldIntersectSystems = Assert<Equal<TestWorldIntersect["systems"], {
//     readonly renderSystem: SystemDeclaration<"renderSystem" | "physicsSystem" | "gravitySystem", any, any, any, any>;
//     readonly physicsSystem: SystemDeclaration<"renderSystem" | "physicsSystem" | "gravitySystem", any, any, any, any>;
//     readonly gravitySystem: SystemDeclaration<"renderSystem" | "physicsSystem" | "gravitySystem", any, any, any, any>;
// }>>;

// Test that archetypes and transactions can reference components from dependencies
type BaseWorldSchema = World.Schema<
    { position: { type: "number" }, health: { type: "number" } },
    {},
    {},
    {},
    "baseSystem"
>;

type ExtendedWorldSchemaResult = ReturnType<typeof World.Schema.create<
    { velocity: { type: "number" } },
    {},
    { DynamicEntity: ["position", "velocity"], LivingEntity: ["position", "health"] },
    {},
    "movementSystem",
    [BaseWorldSchema]
>>;

// type CheckExtendedWorldHasAllComponents = Assert<Equal<ExtendedWorldSchemaResult["components"], {
//     position: { type: "number" };
//     health: { type: "number" };
//     velocity: { type: "number" };
// }>>;

// type CheckExtendedWorldSystems = Assert<Equal<ExtendedWorldSchemaResult["systems"], {
//     readonly baseSystem: SystemDeclaration<"baseSystem" | "movementSystem", any, any, any, any>;
//     readonly movementSystem: SystemDeclaration<"baseSystem" | "movementSystem", any, any, any, any>;
// }>>;
