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

import type { Database } from "./database.js";
import type { ComponentSchemas } from "../component-schemas.js";
import type { ResourceSchemas } from "../resource-schemas.js";
import type { ArchetypeComponents } from "../store/archetype-components.js";
import type { ActionDeclarations, ToActionFunctions } from "../store/action-functions.js";
import type { FromSchemas } from "../../schema/index.js";
import type { StringKeyof } from "../../types/types.js";

type SystemFunction = () => void | Promise<void>;

// Helper type to remove index signatures and keep only known keys
type RemoveIndexSignature<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K]
};

export type SystemDeclarations = { readonly [K in string]: {
    readonly create: (db: Database<any, any, any, any, any>) => SystemFunction;
    readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
} };

export type PluginSchema<
    CS extends ComponentSchemas = {},
    RS extends ResourceSchemas = {},
    A extends ArchetypeComponents<any> = {},
    TD extends ActionDeclarations<any, any, any> = {},
    SYS extends SystemDeclarations = {}
> = {
    components?: CS;
    resources?: RS;
    archetypes?: A;
    transactions?: TD;
    systems?: SYS;
};

// 1 arg
export function createPlugin<
    const CS1 extends ComponentSchemas,
    const RS1 extends ResourceSchemas,
    const A1 extends ArchetypeComponents<any>,
    const TD1 extends ActionDeclarations<any, any, any>,
    const SYS1 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<CS1>, FromSchemas<RS1>, A1, ToActionFunctions<TD1>, string>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
>(
    arg1: PluginSchema<CS1, RS1, A1, TD1, SYS1>
): Database.Plugin.Intersect<[Database.Plugin<CS1, RS1, A1, TD1, StringKeyof<SYS1>>]>;

// 2 args: schema + schema (systems can infer from first schema)
export function createPlugin<
    const CS1 extends ComponentSchemas,
    const RS1 extends ResourceSchemas,
    const A1 extends ArchetypeComponents<any>,
    const TD1 extends ActionDeclarations<any, any, any>,
    const SYS1 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1>>, FromSchemas<RemoveIndexSignature<RS1>>, A1, ToActionFunctions<TD1>, string>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
    const CS2 extends ComponentSchemas,
    const RS2 extends ResourceSchemas,
    const A2 extends ArchetypeComponents<any>,
    const TD2 extends ActionDeclarations<any, any, any>,
    const SYS2 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1 & CS2>>, FromSchemas<RemoveIndexSignature<RS1 & RS2>>, A1 | A2, ToActionFunctions<TD1 & TD2>, StringKeyof<SYS1 & SYS2>>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
>(
    arg1: PluginSchema<CS1, RS1, A1, TD1, SYS1>,
    arg2: PluginSchema<CS2, RS2, A2, TD2, SYS2>
): Database.Plugin.Intersect<[
    Database.Plugin<CS1, RS1, A1, TD1, StringKeyof<SYS1>>,
    Database.Plugin<CS2, RS2, A2, TD2, StringKeyof<SYS2>>
]>;

// 2 args: plugin + schema (systems can infer from plugin)
export function createPlugin<
    const P1 extends Database.Plugin<any, any, any, any, any>,
    const CS2 extends ComponentSchemas,
    const RS2 extends ResourceSchemas,
    const A2 extends ArchetypeComponents<any>,
    const TD2 extends ActionDeclarations<any, any, any>,
    const SYS2 extends SystemDeclarations,
>(
    arg1: P1,
    arg2: PluginSchema<CS2, RS2, A2, TD2, SYS2>
): Database.Plugin.Intersect<[P1, Database.Plugin<CS2, RS2, A2, TD2, StringKeyof<SYS2>>]>;

// 3 args: schema + schema + schema (third can infer from first two)
export function createPlugin<
    const CS1 extends ComponentSchemas,
    const RS1 extends ResourceSchemas,
    const A1 extends ArchetypeComponents<any>,
    const TD1 extends ActionDeclarations<any, any, any>,
    const SYS1 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1>>, FromSchemas<RemoveIndexSignature<RS1>>, A1, ToActionFunctions<TD1>, string>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
    const CS2 extends ComponentSchemas,
    const RS2 extends ResourceSchemas,
    const A2 extends ArchetypeComponents<any>,
    const TD2 extends ActionDeclarations<any, any, any>,
    const SYS2 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1 & CS2>>, FromSchemas<RemoveIndexSignature<RS1 & RS2>>, A1 | A2, ToActionFunctions<TD1 & TD2>, StringKeyof<SYS1 & SYS2>>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
    const CS3 extends ComponentSchemas,
    const RS3 extends ResourceSchemas,
    const A3 extends ArchetypeComponents<any>,
    const TD3 extends ActionDeclarations<any, any, any>,
    const SYS3 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1 & CS2 & CS3>>, FromSchemas<RemoveIndexSignature<RS1 & RS2 & RS3>>, A1 | A2 | A3, ToActionFunctions<TD1 & TD2 & TD3>, StringKeyof<SYS1 & SYS2 & SYS3>>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
>(
    arg1: PluginSchema<CS1, RS1, A1, TD1, SYS1>,
    arg2: PluginSchema<CS2, RS2, A2, TD2, SYS2>,
    arg3: PluginSchema<CS3, RS3, A3, TD3, SYS3>
): Database.Plugin.Intersect<[
    Database.Plugin<CS1, RS1, A1, TD1, StringKeyof<SYS1>>,
    Database.Plugin<CS2, RS2, A2, TD2, StringKeyof<SYS2>>,
    Database.Plugin<CS3, RS3, A3, TD3, StringKeyof<SYS3>>
]>;

// 3 args: plugin + plugin + schema
export function createPlugin<
    const P1 extends Database.Plugin<any, any, any, any, any>,
    const P2 extends Database.Plugin<any, any, any, any, any>,
    const CS3 extends ComponentSchemas,
    const RS3 extends ResourceSchemas,
    const A3 extends ArchetypeComponents<any>,
    const TD3 extends ActionDeclarations<any, any, any>,
    const SYS3 extends SystemDeclarations,
>(
    arg1: P1,
    arg2: P2,
    arg3: PluginSchema<CS3, RS3, A3, TD3, SYS3>
): Database.Plugin.Intersect<[P1, P2, Database.Plugin<CS3, RS3, A3, TD3, StringKeyof<SYS3>>]>;

// 3 args: plugin + schema + schema
export function createPlugin<
    const P1 extends Database.Plugin<any, any, any, any, any>,
    const CS2 extends ComponentSchemas,
    const RS2 extends ResourceSchemas,
    const A2 extends ArchetypeComponents<any>,
    const TD2 extends ActionDeclarations<any, any, any>,
    const SYS2 extends SystemDeclarations,
    const CS3 extends ComponentSchemas,
    const RS3 extends ResourceSchemas,
    const A3 extends ArchetypeComponents<any>,
    const TD3 extends ActionDeclarations<any, any, any>,
    const SYS3 extends SystemDeclarations,
>(
    arg1: P1,
    arg2: PluginSchema<CS2, RS2, A2, TD2, SYS2>,
    arg3: PluginSchema<CS3, RS3, A3, TD3, SYS3>
): Database.Plugin.Intersect<[
    P1,
    Database.Plugin<CS2, RS2, A2, TD2, StringKeyof<SYS2>>,
    Database.Plugin<CS3, RS3, A3, TD3, StringKeyof<SYS3>>
]>;

// 4 args: schema + schema + schema + schema (fourth can infer from first three)
export function createPlugin<
    const CS1 extends ComponentSchemas,
    const RS1 extends ResourceSchemas,
    const A1 extends ArchetypeComponents<any>,
    const TD1 extends ActionDeclarations<any, any, any>,
    const SYS1 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1>>, FromSchemas<RemoveIndexSignature<RS1>>, A1, ToActionFunctions<TD1>, string>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
    const CS2 extends ComponentSchemas,
    const RS2 extends ResourceSchemas,
    const A2 extends ArchetypeComponents<any>,
    const TD2 extends ActionDeclarations<any, any, any>,
    const SYS2 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1 & CS2>>, FromSchemas<RemoveIndexSignature<RS1 & RS2>>, A1 | A2, ToActionFunctions<TD1 & TD2>, StringKeyof<SYS1 & SYS2>>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
    const CS3 extends ComponentSchemas,
    const RS3 extends ResourceSchemas,
    const A3 extends ArchetypeComponents<any>,
    const TD3 extends ActionDeclarations<any, any, any>,
    const SYS3 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1 & CS2 & CS3>>, FromSchemas<RemoveIndexSignature<RS1 & RS2 & RS3>>, A1 | A2 | A3, ToActionFunctions<TD1 & TD2 & TD3>, StringKeyof<SYS1 & SYS2 & SYS3>>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
    const CS4 extends ComponentSchemas,
    const RS4 extends ResourceSchemas,
    const A4 extends ArchetypeComponents<any>,
    const TD4 extends ActionDeclarations<any, any, any>,
    const SYS4 extends { readonly [K in string]: {
        readonly create: (db: Database<FromSchemas<RemoveIndexSignature<CS1 & CS2 & CS3 & CS4>>, FromSchemas<RemoveIndexSignature<RS1 & RS2 & RS3 & RS4>>, A1 | A2 | A3 | A4, ToActionFunctions<TD1 & TD2 & TD3 & TD4>, StringKeyof<SYS1 & SYS2 & SYS3 & SYS4>>) => SystemFunction;
        readonly schedule?: { readonly before?: readonly string[]; readonly after?: readonly string[] };
    } },
>(
    arg1: PluginSchema<CS1, RS1, A1, TD1, SYS1>,
    arg2: PluginSchema<CS2, RS2, A2, TD2, SYS2>,
    arg3: PluginSchema<CS3, RS3, A3, TD3, SYS3>,
    arg4: PluginSchema<CS4, RS4, A4, TD4, SYS4>
): Database.Plugin.Intersect<[
    Database.Plugin<CS1, RS1, A1, TD1, StringKeyof<SYS1>>,
    Database.Plugin<CS2, RS2, A2, TD2, StringKeyof<SYS2>>,
    Database.Plugin<CS3, RS3, A3, TD3, StringKeyof<SYS3>>,
    Database.Plugin<CS4, RS4, A4, TD4, StringKeyof<SYS4>>
]>;

// 4 args: plugin + plugin + plugin + schema
export function createPlugin<
    const P1 extends Database.Plugin<any, any, any, any, any>,
    const P2 extends Database.Plugin<any, any, any, any, any>,
    const P3 extends Database.Plugin<any, any, any, any, any>,
    const CS4 extends ComponentSchemas,
    const RS4 extends ResourceSchemas,
    const A4 extends ArchetypeComponents<any>,
    const TD4 extends ActionDeclarations<any, any, any>,
    const SYS4 extends SystemDeclarations,
>(
    arg1: P1,
    arg2: P2,
    arg3: P3,
    arg4: PluginSchema<CS4, RS4, A4, TD4, SYS4>
): Database.Plugin.Intersect<[P1, P2, P3, Database.Plugin<CS4, RS4, A4, TD4, StringKeyof<SYS4>>]>;

// 4 args: plugin + plugin + schema + schema
export function createPlugin<
    const P1 extends Database.Plugin<any, any, any, any, any>,
    const P2 extends Database.Plugin<any, any, any, any, any>,
    const CS3 extends ComponentSchemas,
    const RS3 extends ResourceSchemas,
    const A3 extends ArchetypeComponents<any>,
    const TD3 extends ActionDeclarations<any, any, any>,
    const SYS3 extends SystemDeclarations,
    const CS4 extends ComponentSchemas,
    const RS4 extends ResourceSchemas,
    const A4 extends ArchetypeComponents<any>,
    const TD4 extends ActionDeclarations<any, any, any>,
    const SYS4 extends SystemDeclarations,
>(
    arg1: P1,
    arg2: P2,
    arg3: PluginSchema<CS3, RS3, A3, TD3, SYS3>,
    arg4: PluginSchema<CS4, RS4, A4, TD4, SYS4>
): Database.Plugin.Intersect<[
    P1,
    P2,
    Database.Plugin<CS3, RS3, A3, TD3, StringKeyof<SYS3>>,
    Database.Plugin<CS4, RS4, A4, TD4, StringKeyof<SYS4>>
]>;

// Implementation
export function createPlugin(...args: any[]): any {
    const result = args.reduce((acc, curr) => ({
        components: { ...acc.components, ...curr.components },
        resources: { ...acc.resources, ...curr.resources },
        archetypes: { ...acc.archetypes, ...curr.archetypes },
        transactions: { ...acc.transactions, ...curr.transactions },
        systems: { ...acc.systems, ...curr.systems },
    }), {
        components: {},
        resources: {},
        archetypes: {},
        transactions: {},
        systems: {},
    });

    // Validate system schedule references
    if (result.systems) {
        const systemNames = new Set(Object.keys(result.systems));
        for (const [systemName, systemDef] of Object.entries(result.systems)) {
            const schedule = (systemDef as any)?.schedule;
            if (schedule) {
                const validateRefs = (refs: string[] | undefined, type: 'before' | 'after') => {
                    if (refs) {
                        for (const ref of refs) {
                            if (!systemNames.has(ref)) {
                                throw new Error(
                                    `System "${systemName}" references non-existent system "${ref}" in schedule.${type}`
                                );
                            }
                        }
                    }
                };
                validateRefs(schedule.before, 'before');
                validateRefs(schedule.after, 'after');
            }
        }
    }

    return result;
}
