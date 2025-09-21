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

import { FromSchemas } from "../../../schema/schema.js";
import { ComponentSchemas } from "../../component-schemas.js";
import { ResourceSchemas } from "../../resource-schemas.js";
import { StringKeyof } from "../../../types/types.js";
import { AsyncArgsProvider, Database, ToTransactionFunctions, TransactionDeclarations } from "../../database/database.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { Assert } from "../../../types/assert.js";
import { Equal } from "../../../types/equal.js";
import { ReadonlyArchetype } from "../../archetype/archetype.js";
import { CoreComponents } from "../../core-components.js";
import { World } from "../world.js";
import { System } from "../system.js";
import { Store } from "../../index.js";

export type WorldSchema<
    CS extends ComponentSchemas,
    RS extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<CS>>,
    TD extends TransactionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>,
    SD extends { readonly [K: string]: System<FromSchemas<CS>, FromSchemas<RS>, A, ToTransactionFunctions<TD>, StringKeyof<SD>> },
> = {
    readonly components: CS;
    readonly resources: RS;
    readonly archetypes: A;
    readonly transactions: TD;
    readonly systems: SD;
};

export type WorldFromSchema<T> = T extends WorldSchema<infer CS, infer RS, infer A, infer TD, infer SD>
    ? World<FromSchemas<CS>, FromSchemas<RS>, A, ToTransactionFunctions<TD>, StringKeyof<SD>>
    : never;

type CheckWorldFromSchema = WorldFromSchema<WorldSchema<{
    velocity: { type: "number" },
    particle: { type: "boolean" },
}, {
    mousePosition: { type: "number", default: 0 },
    fooPosition: { type: "number", default: 0 },
}, {
    Particle: ["particle"],
    DynamicParticle: ["particle", "velocity"],
}, {
    readonly createParticle: (t: any, args: { particle: boolean }) => void;
    readonly createDynamicParticle: (t: any, args: { particle: boolean, velocity: number }) => void;
}, {
    readonly foo: {
        type: "store";
        run: ((store: Store<any, any, any>) => void),
    }
    readonly bar: {
        type: "database";
        run: ((database: Database<any, any, any, any>) => void),
    }
}>>;
declare const testWorld: CheckWorldFromSchema;
type CheckDynamicParticle = Assert<Equal<typeof testWorld.archetypes.DynamicParticle, ReadonlyArchetype<CoreComponents & {
    particle: boolean;
    velocity: number;
}>>>;
type CheckParticle = Assert<Equal<typeof testWorld.archetypes.Particle, ReadonlyArchetype<CoreComponents & {
    particle: boolean;
}>>>;
type CheckCreateParticle = Assert<Equal<typeof testWorld.transactions.createParticle, (arg: {
    particle: boolean;
} | AsyncArgsProvider<{
    particle: boolean;
}>) => void>>;
type CheckCreateDynamicParticle = Assert<Equal<typeof testWorld.transactions.createDynamicParticle, (arg: {
    particle: boolean;
    velocity: number;
} | AsyncArgsProvider<{
    particle: boolean;
    velocity: number;
}>) => void>>;
type CheckRunSystems = Assert<Equal<typeof testWorld.runSystems, (systems: readonly ("foo" | "bar")[]) => Promise<void>>>;

