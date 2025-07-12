import { EntityReadValues, EntityUpdateValues } from "../../store/core/index.js";

export function patchEntityValues<C extends object>(a: EntityUpdateValues<C> | EntityReadValues<C> | null | undefined, b: EntityUpdateValues<C> | null) {
    if (!a || !b) {
        return b;
    }
    return { ...a, ...b };
}
