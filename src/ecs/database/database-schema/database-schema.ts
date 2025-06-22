import { Schema } from "@adobe/data/schema";
import { TransactionDeclaration, TransactionFunctions } from "../database.js";
import { CoreComponents } from "../../core-components.js";
import { ResourceComponents } from "../../store/resource-components.js";

export type DatabaseSchema<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
    T extends TransactionFunctions = never,
> = {
    readonly components: Record<string, Schema>;
    readonly resources: Record<string, Schema>;
    readonly transactions: Record<string, TransactionDeclaration<C, R>>;
};
