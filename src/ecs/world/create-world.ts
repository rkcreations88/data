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
import { StringKeyof } from "../../types/types.js";
import { ArchetypeComponents, ComponentSchemas, Components, Database, OptionalComponents, ResourceComponents, ResourceSchemas } from "../index.js";
import { ActionDeclarations, ActionFunctions, ToActionFunctions } from "../store/action-functions.js";
import { World } from "./world.js";
import { calculateSystemOrder } from "./calculate-system-order.js";

type SystemFunction = () => void | Promise<void>;

type SystemDeclaration<
    C extends Components = any,
    R extends ResourceComponents = any,
    A extends ArchetypeComponents<StringKeyof<C & OptionalComponents>> = any,
    F extends ActionFunctions = any,
    S extends string = any
> = {
    readonly create: (world: World<C, R, A, F, S>) => SystemFunction;
    readonly schedule?: {
        readonly before?: readonly string[];
        readonly after?: readonly string[];
    };
};

export function createWorld(): World<{}, {}, {}, {}, never>
export function createWorld<
    CS extends ComponentSchemas,
    RS extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<CS>>,
    TD extends ActionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>,
    S extends string
>(schema: World.Schema<CS, RS, A, TD, S>): World<
    FromSchemas<CS>,
    FromSchemas<RS>,
    A,
    ToActionFunctions<TD>,
    S
>
export function createWorld<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C & OptionalComponents>>,
    F extends ActionFunctions,
    S extends string
>(
    database: Database<C, R, A, F>,
    systemDeclarations: { readonly [K in S]: SystemDeclaration<C, R, A, F, S> }
): World<C, R, A, F, S>
export function createWorld(
    schemaOrDatabase?: World.Schema<any, any, any, any, any> | Database<any, any, any, any>,
    systemDeclarations?: any
): any {
    if (!schemaOrDatabase) {
        return createWorldFromSchema(World.Schema.create({}));
    }
    if (systemDeclarations) {
        return createWorldFromDatabaseAndSystems(schemaOrDatabase as any, systemDeclarations);
    } else {
        return createWorldFromSchema(schemaOrDatabase as any);
    }
}

function createWorldFromSchema<
    CS extends ComponentSchemas,
    RS extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<CS>>,
    TD extends ActionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>,
    S extends string
>(schema: World.Schema<CS, RS, A, TD, S>): World<
    FromSchemas<CS>,
    FromSchemas<RS>,
    A,
    ToActionFunctions<TD>,
    S
> {
    const dbSchema = {
        components: schema.components,
        resources: schema.resources,
        archetypes: schema.archetypes,
        transactions: schema.transactions
    };

    const database = Database.create(dbSchema);
    return createWorldFromDatabaseAndSystems(database, schema.systems);
}

function createWorldFromDatabaseAndSystems<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C & OptionalComponents>>,
    F extends ActionFunctions,
    S extends string
>(
    database: Database<C, R, A, F>,
    systemDeclarations: { readonly [K in S]: SystemDeclaration<C, R, A, F, S> }
): World<C, R, A, F, S> {
    type SystemNames = S;

    // Calculate execution order from schedule constraints
    const executionOrder = calculateSystemOrder(systemDeclarations);

    // Create partial world shell (two-phase initialization to avoid circular dependency)
    const partialWorld: any = {
        database,
        system: {
            functions: {},  // Empty initially
            order: executionOrder
        },
        extend: undefined  // Will be set later
    };

    // NOW instantiate system functions with full world reference
    const systemFunctions: any = {};
    for (const name in systemDeclarations) {
        systemFunctions[name] = systemDeclarations[name].create(partialWorld);
    }

    // Assign systems to world
    partialWorld.system.functions = systemFunctions;

    // Add extend method
    const extend = <XS extends World.Schema<any, any, any, any, any>>(
        schema: XS
    ): any => {
        // Extend database with new components, resources, transactions
        const extendedDatabase = database.extend(schema);

        // Merge system declarations
        const mergedSystemDeclarations = {
            ...systemDeclarations,
            ...schema.systems
        } as any;

        // Create new world with merged systems
        return createWorldFromDatabaseAndSystems(extendedDatabase as any, mergedSystemDeclarations);
    };

    partialWorld.extend = extend;

    return partialWorld as World<C, R, A, F, SystemNames>;
}
