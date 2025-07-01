import { FromSchemas } from "@adobe/data/schema";
import { Database, TransactionDeclaration } from "../database.js";
import { ComponentSchemas } from "../../component-schemas.js";
import { ResourceSchemas } from "../../resource-schemas.js";
import { Store } from "../../store/store.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { StringKeyof } from "../../../types/types.js";

export type DatabaseSchema<
    CS extends ComponentSchemas,
    RS extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<CS>>,
    TD extends Record<string, TransactionDeclaration>
> = {
    readonly components: CS;
    readonly resources: RS;
    readonly archetypes: A;
    readonly transactions: (store: Store<FromSchemas<CS>, FromSchemas<RS>, A>) => TD;
};

export type DatabaseFromSchema<T> = T extends DatabaseSchema<infer CS, infer RS, infer A, infer TD> ? Database<FromSchemas<CS>, FromSchemas<RS>, A, TD> : never;

export type StoreFromSchema<T> = T extends DatabaseSchema<infer CS, infer RS, infer A, infer TD> ? Store<FromSchemas<CS>, FromSchemas<RS>, A> : never;
