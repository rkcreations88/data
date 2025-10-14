/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

import { Table } from "../../table/index.js";
import { Aabb } from "../index.js";
import { Line3 } from "../index.js";
import { Entity } from "../../ecs/index.js";
import { PickResult } from "./pick-result.js";
import { getIntersectingEntities } from "./get-intersecting-entities.js";
import { getClosestEntityToPoint } from "./get-closest-entity-to-point.js";
import { getClosestEntityToLine } from "./get-closest-entity-to-line.js";

/**
 * Picks the closest intersecting row from a table.
 * This would be the broad phase picking step.
 * @returns The entity id and picked position, or null if no entity is found.
 */
export function pickFromTables<T extends Table<{ id: Entity, boundingBox: Aabb }>>(options: {
    tables: readonly T[],
    line: Line3,
    radius?: number,
    predicate?: (table: T, row: number) => boolean,
}): PickResult | null {
    const { tables, line, radius = 0, predicate } = options;
    let rows = getIntersectingEntities({ tables, line, radius: 0, predicate });
    if (rows.size > 0) {
        // For direct intersection, find the alpha for the closest intersecting entity
        let best: { id: Entity, alpha: number } | null = null;
        for (const [id, aabb] of rows) {
            const alpha = Aabb.lineIntersection(aabb, line, 0);
            if (alpha !== -1 && (best === null || alpha < best.alpha)) {
                best = { id, alpha };
            }
        }
        if (best) {
            return {
                entity: best.id,
                lineAlpha: best.alpha,
                entityPosition: Line3.interpolate(line, best.alpha),
                // face: AabbFace.fromPosition(Line3.interpolate(line, best.alpha), rows.get(best.id)!),
            };
        }
        // fallback (should not happen):
        return getClosestEntityToPoint(rows, line.a);
    } else if (radius > 0) {
        rows = getIntersectingEntities({ tables, line, radius, predicate });
        if (rows.size > 0) {
            return getClosestEntityToLine(rows, line);
        }
    }
    return null;
}