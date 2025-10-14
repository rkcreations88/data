import { Entity } from "../../ecs/index.js";
import { Aabb, Vec3 } from "../index.js";
import { PickResult } from "./pick-result.js";

export function getClosestEntityToPoint(rows: Map<Entity, Aabb>, point: Vec3): PickResult | null {
    let closestRow = -1;
    let closestDistanceSquared = Infinity;
    let closestAabb: Aabb | null = null;
    for (const [row, aabb] of rows) {
        const distSquared = Vec3.distanceSquared(point, Aabb.center(aabb));
        if (distSquared < closestDistanceSquared) {
            closestDistanceSquared = distSquared;
            closestRow = row;
            closestAabb = aabb;
        }
    }
    if (closestRow !== -1 && closestAabb) {
        // For point-based picking, we need to calculate the alpha along the line
        // that would put us at the closest point to the AABB center
        // Since this function is called with a point (line.a), alpha should be 0
        return {
            entity: closestRow,
            lineAlpha: 0,
            entityPosition: point,
            // face: AabbFace.fromPosition(point, closestAabb),
        };
    }
    return null;
}
