import { StringKeyof } from "../../../types/types.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { Components } from "../../store/components.js";
import { ResourceComponents } from "../../store/resource-components.js";
import { Store } from "../../store/store.js";
import { Transaction } from "./transactional-store.js";

export const createTestTransaction = <
    C extends Components = never,
    R extends ResourceComponents = never,
    A extends ArchetypeComponents<StringKeyof<C>> = never,
>(store: Store<C, R, A>): Transaction<C, R, A> => {
    return Object.assign(store, {
        transient: false,
        undoable: null,
    });
}
