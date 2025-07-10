import { EntityValues, EntityUpdateValues } from "../../store/core/index.js";

export function patchEntityValues<C extends object>(a: EntityUpdateValues<C> | EntityValues<C> | null | undefined, b: EntityUpdateValues<C> | null) {
    if (!a || !b) {
        return b;
    }
    return { ...a, ...b };
}
