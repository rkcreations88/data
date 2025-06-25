import { FromSchemas } from "../../../schema/schema.js";
import { ComponentSchemas } from "../../component-schemas.js";
import { ResourceSchemas } from "../../resource-schemas.js";
import { Store } from "../../store/store.js";
import { TransactionDeclaration } from "../database.js";
import { DatabaseSchema } from "./database-schema.js";

export function createDatabaseSchema<
    CS extends ComponentSchemas = ComponentSchemas,
    RS extends ResourceSchemas = ResourceSchemas,
    TD extends Record<string, TransactionDeclaration> = Record<string, TransactionDeclaration>
>(components: CS, resources: RS, transactions: (store: Store<FromSchemas<CS>, FromSchemas<RS>>) => TD): DatabaseSchema<CS, RS, TD> {
    return { components, resources, transactions } satisfies DatabaseSchema<CS, RS, TD> as any;
};
