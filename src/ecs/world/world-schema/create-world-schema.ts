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
import { StringKeyof } from "../../../types/types.js";
import { ComponentSchemas } from "../../component-schemas.js";
import { System, ToTransactionFunctions, TransactionDeclarations, createDatabase, createStoreFromSchema, createWorld } from "../../index.js";
import { ResourceSchemas } from "../../resource-schemas.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { WorldFromSchema, WorldSchema } from "./world-schema.js";

export function createWorldSchema<
    const CS extends ComponentSchemas,
    const RS extends ResourceSchemas,
    const A extends ArchetypeComponents<StringKeyof<CS>>,
    const TD extends TransactionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>,
    const SD extends { readonly [K: string]: System<FromSchemas<CS>, FromSchemas<RS>, A, ToTransactionFunctions<TD>, StringKeyof<SD>> }
>(
    components: CS,
    resources: RS,
    archetypes: A,
    transactions: TD,
    systems: SD,
) {
    return { components, resources, archetypes, transactions, systems } as const satisfies WorldSchema<CS, RS, A, TD, SD>;
};

export function createWorldFromSchema<
    const CS extends ComponentSchemas,
    const RS extends ResourceSchemas,
    const A extends ArchetypeComponents<StringKeyof<CS>>,
    const TD extends TransactionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>,
    const SD extends { readonly [K: string]: System<FromSchemas<CS>, FromSchemas<RS>, A, ToTransactionFunctions<TD>, StringKeyof<SD>> }
>(
    schema: WorldSchema<CS, RS, A, TD, SD>,
): WorldFromSchema<typeof schema> {
    const store = createStoreFromSchema(schema);
    const database = createDatabase(store, schema.transactions as any);
    return createWorld(
        store,
        database as any,
        schema.systems as any
    ) as any;
};
