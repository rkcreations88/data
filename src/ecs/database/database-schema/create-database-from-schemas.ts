import { FromSchemas } from "../../../schema/schema.js";
import { Simplify, UnionToIntersection } from "../../../types/types.js";
import { Entity } from "../../entity.js";
import { createStore } from "../../store/create-store.js";
import { Store } from "../../store/store.js";
import { createDatabase } from "../create-database.js";
import { Database } from "../database.js";
import { createDatabaseSchema } from "./create-database-schema.js";
import { DatabaseSchema } from "./database-schema.js";

type AllComponents<DS extends DatabaseSchema[]> =
    UnionToIntersection<
        FromSchemas<DS[number]['components']>
    > & object;

type AllResources<DS extends DatabaseSchema[]> =
    UnionToIntersection<
        FromSchemas<DS[number]['resources']>
    > & object;

type AllTransactions<DS extends DatabaseSchema[]> =
    UnionToIntersection<DS[number] extends DatabaseSchema<any, any, infer T> ? T : never>
    & object;

type DatabaseFromSchemas<DS extends DatabaseSchema[]> =
    Database<
        Simplify<AllComponents<DS>>,
        Simplify<AllResources<DS>>,
        AllTransactions<DS>
    >;

type StoreFromSchemas<DS extends DatabaseSchema[]> =
    Store<
        Simplify<AllComponents<DS>>,
        Simplify<AllResources<DS>>
    >;

export const createDatabaseFromSchemas = <DS extends DatabaseSchema[]>(...schemas: DS): { database: DatabaseFromSchemas<DS>, store: StoreFromSchemas<DS> } => {
    const componentSchemas = Object.assign({}, ...schemas.map(s => s.components));
    const resourceSchemas = Object.assign({}, ...schemas.map(s => s.resources));
    const transactionDeclarations = (store: Store<any, any>) => Object.assign({}, ...schemas.map(s => s.transactions(store)));
    const store = createStore(componentSchemas, resourceSchemas);
    const database = createDatabase(store, transactionDeclarations);
    return { database, store} as any;
}

(
    () => {
        const alphaSchema = createDatabaseSchema(
            { alpha: { default: 0, transient: true } },
            { alphaResource: { default: 0, transient: true } },
            (store) => ({
                updateAlpha: (arg: { entity: Entity, alpha: number }) => {
                    store.update(arg.entity, { alpha: arg.alpha });
                    return arg.entity;
                }
            })
        );
        const betaSchema = createDatabaseSchema(
            { beta: { default: 0, transient: true } },
            { betaResource: { default: 0, transient: true } },
            (store) => ({
                updateBeta: (arg: { entity: Entity, beta: number }) => {
                    store.update(arg.entity, { beta: arg.beta });
                }
            })
        )
        const combinedSchema = createDatabaseFromSchemas(alphaSchema, betaSchema).database;
        combinedSchema.transactions.updateAlpha({ entity: 1, alpha: 1 });
        combinedSchema.transactions.updateBeta({ entity: 2, beta: 2 });
        combinedSchema.queryArchetypes(["alpha", "beta"]);
        // @ts-expect-error
        combinedSchema.transactions.wrongAlpha(1);
        // @ts-expect-error
        combinedSchema.queryArchetypes(["wrong"]);
    }
)