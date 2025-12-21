import { FromSchemas } from "../../../../schema/from-schemas.js";
import { StringKeyof } from "../../../../types/types.js";
import { ComponentSchemas } from "../../../component-schemas.js";
import { ArchetypeComponents, Database } from "../../../index.js";
import { ResourceSchemas } from "../../../resource-schemas.js";
import { ActionDeclarations, ToActionFunctions } from "../../../store/action-functions.js";
import { SystemDeclarations, SystemFunctions, WorldSchema } from "../world-schema.js";

export function create<
    C extends ComponentSchemas,
    R extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<C>>,
    T extends ActionDeclarations<FromSchemas<C>, FromSchemas<R>, A>,
    S extends string,
>(
    schema: Database.Schema<C, R, A, T>,
    systems: SystemDeclarations<S>,
    create: (db: Database<FromSchemas<C>, FromSchemas<R>, A, ToActionFunctions<T>>) => SystemFunctions<S>
) {
    return {
        schema,
        systems,
        create,
    } as const satisfies WorldSchema<C, R, A, T, S>;
}
