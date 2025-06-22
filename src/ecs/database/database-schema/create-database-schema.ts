import { FromSchemas, Schema } from "../../../schema/schema.js";
import { CoreComponents } from "../../core-components.js";
import { ToTransactionFunctions, TransactionDeclarations } from "../database.js";
import { DatabaseSchema } from "./database-schema.js";

export const createDatabaseSchema = <
    CS extends Record<string, Schema>,
    RS extends Record<string, Schema>,
    TD extends TransactionDeclarations<FromSchemas<CS> & CoreComponents, FromSchemas<RS>>
>({ components, resources, transactions }: {
    components: CS;
    resources: RS;
    transactions: TD;
}): DatabaseSchema<FromSchemas<CS> & CoreComponents, FromSchemas<RS>, ToTransactionFunctions<TD>> => {
    return {
        components,
        resources,
        transactions,
    };
};