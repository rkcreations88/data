import { Entity } from "../../ecs/index.js";
import { Table } from "../../table/table.js";
import { Aabb, Line3 } from "../index.js";

export function getIntersectingEntities<T extends Table<{ id: Entity; boundingBox: Aabb; }>>(options: {
    tables: readonly T[];
    line: Line3;
    radius?: number;
    predicate?: (table: T, row: number) => boolean;
}): Map<Entity, Aabb> {
    const { tables, line, radius = 0, predicate } = options;
    const rows = new Map<number, Aabb>();
    for (const table of tables) {
        for (let row = 0; row < table.rowCount; row++) {
            const boundingBox = table.columns.boundingBox.get(row);
            if (Aabb.lineIntersection(boundingBox, line, radius) !== -1 && (predicate?.(table, row) ?? true)) {
                rows.set(table.columns.id.get(row), boundingBox);
            }
        }
    }
    return rows;
}
