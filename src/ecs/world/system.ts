import { StringKeyof } from "../../types/types.js";
import { Database, Store, TransactionFunctions } from "../index.js";
import { ArchetypeComponents } from "../store/archetype-components.js";
import { Components } from "../store/components.js";
import { ResourceComponents } from "../store/resource-components.js";
import { SystemNames } from "./world.js";

export type StoreSystem<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>,
> = {
    type: "store";
    run: ((store: Store<C, R, A>) => void) | ((store: Store<C, R, A>) => Promise<void>);
}

export type DatabaseSystem<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>,
    T extends TransactionFunctions,
> = {
    type: "database"
    run: ((database: Database<C, R, A, T>) => void) | ((database: Database<C, R, A, T>) => Promise<void>);
}

export type System<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>,
    T extends TransactionFunctions,
    S extends SystemNames
> = (StoreSystem<C, R, A> | DatabaseSystem<C, R, A, T>) & {
    schedule?: {
        before?: readonly S[];
        after?: readonly S[];
    }
};
