import { FromSchemas } from "@adobe/data/schema";
import { Database, TransactionDeclarations } from "../database.js";
import { ComponentSchemas } from "../../component-schemas.js";
import { ResourceSchemas } from "../../resource-schemas.js";
import { Store } from "../../store/store.js";

export type DatabaseSchema<
    CS extends ComponentSchemas = ComponentSchemas,
    RS extends ResourceSchemas = ResourceSchemas,
    TD = TransactionDeclarations
> = {
    readonly components: CS;
    readonly resources: RS;
    readonly transactions: (store: Store<any, any>) => TD;
};

export type DatabaseFromSchema<DS extends DatabaseSchema<any, any, any>> = Database<
    FromSchemas<DS["components"]>,
    FromSchemas<DS["resources"]>,
    DS["transactions"]
>;
