import { FromSchemas, Schema } from "../../../schema/schema.js";
import { StringKeyof } from "../../../types/types.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { Store } from "../../store/store.js";
import { TransactionDeclaration } from "../database.js";

export function createDatabaseSchema<
    const CS extends Record<string, Schema>,
    const RS extends Record<string, Schema & { default?: any }>,
    const A extends ArchetypeComponents<StringKeyof<CS>>,
    const TD extends Record<string, TransactionDeclaration>
>(
    components: CS,
    resources: RS,
    archetypes: A,
    transactions: (store: Store<FromSchemas<CS>, FromSchemas<RS>, A>) => TD,
) {
    return { components, resources, archetypes, transactions };
};
