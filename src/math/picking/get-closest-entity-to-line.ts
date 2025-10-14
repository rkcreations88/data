import { Entity } from "../../ecs/index.js";
import { Aabb, Line3, Vec3 } from "../index.js";
import { PickResult } from "./pick-result.js";

export function getClosestEntityToLine(rows: Map<Entity, Aabb>, line: Line3): PickResult | null {
    let closestEntity: Entity | null = null;
    let closestDistanceSquared = Infinity;
    let closestAlpha = Infinity;
    let pickedPosition: Vec3 | null = null;
    for (const [id, aabb] of rows) {
        const aabbCenter = Aabb.center(aabb);
        const alpha = Line3.closestPointOnLine(line, aabbCenter);
        const closestPointOnLineSegment = Line3.interpolate(line, alpha);
        const distSquared = Vec3.distanceSquared(aabbCenter, closestPointOnLineSegment);
        if (distSquared < closestDistanceSquared ||
            (distSquared === closestDistanceSquared && alpha < closestAlpha)) {
            closestDistanceSquared = distSquared;
            closestAlpha = alpha;
            closestEntity = id;
            pickedPosition = closestPointOnLineSegment;
        }
    }
    if (closestEntity !== null && pickedPosition) {
        return {
            entity: closestEntity,
            lineAlpha: closestAlpha,
            entityPosition: pickedPosition,
            // face: AabbFace.fromPosition(pickedPosition, rows.get(closestEntity)!),
        };
    }
    return null;
}
