import { FromSchemas } from "@adobe/data/schema";
import { Database, TransactionDeclaration } from "../database.js";
import { ComponentSchemas } from "../../component-schemas.js";
import { ResourceSchemas } from "../../resource-schemas.js";
import { Store } from "../../store/store.js";

export type DatabaseSchema<
    CS extends ComponentSchemas = ComponentSchemas,
    RS extends ResourceSchemas = ResourceSchemas,
    TD extends Record<string, TransactionDeclaration> = Record<string, TransactionDeclaration>
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

export type StoreFromSchema<DS extends DatabaseSchema<any, any, any>> = Store<
    FromSchemas<DS["components"]>,
    FromSchemas<DS["resources"]>
>;
