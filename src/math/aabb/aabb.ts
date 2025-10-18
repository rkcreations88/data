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

import { FromSchema, Schema } from "../../schema/index.js";
import { getStructLayout } from "../../typed-buffer/index.js";
import { Vec3 } from "../index.js";

export type Aabb = FromSchema<typeof Aabb.schema>;

export namespace Aabb {
    const { schema: Vec3Schema } = Vec3;

    export const schema = {
        type: 'object',
        properties: {
            min: Vec3Schema,
            max: Vec3Schema,
        },
        required: ['min', 'max'],
        additionalProperties: false,
        default: {
            min: Vec3Schema.default,
            max: Vec3Schema.default,
        }
    } as const satisfies Schema;
    export const layout = getStructLayout(schema);

    /**
     * A unit AABB is a cube with side length 1 centered at the origin.
     */
    export const unit: Aabb = {
        min: [-0.5, -0.5, -0.5],
        max: [0.5, 0.5, 0.5],
    };

    // AABB utility functions
    export const center = (aabb: Aabb): Vec3 => [
        (aabb.min[0] + aabb.max[0]) / 2,
        (aabb.min[1] + aabb.max[1]) / 2,
        (aabb.min[2] + aabb.max[2]) / 2,
    ];

    /**
     * @returns the alpha distance along the line (0-1) where the line intersects the box or -1 if it does not.
     * @param radius - The radius of the line (treats line as a cylinder). Defaults to 0.
     */
    export const lineIntersection = (box: Aabb, line: { a: Vec3; b: Vec3 }, radius: number = 0): number => {
        const { min, max } = box;
        const { a, b } = line;

        // Expand the box by the radius to treat the line as a cylinder
        const expandedMin = [min[0] - radius, min[1] - radius, min[2] - radius];
        const expandedMax = [max[0] + radius, max[1] + radius, max[2] + radius];

        // Calculate line direction vector
        const dir = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];

        // Calculate intersection parameters for each axis
        const tMinX = (expandedMin[0] - a[0]) / dir[0];
        const tMaxX = (expandedMax[0] - a[0]) / dir[0];
        const tMinY = (expandedMin[1] - a[1]) / dir[1];
        const tMaxY = (expandedMax[1] - a[1]) / dir[1];
        const tMinZ = (expandedMin[2] - a[2]) / dir[2];
        const tMaxZ = (expandedMax[2] - a[2]) / dir[2];

        // Handle division by zero (line parallel to axis)
        const tMinXFinal = dir[0] >= 0 ? tMinX : tMaxX;
        const tMaxXFinal = dir[0] >= 0 ? tMaxX : tMinX;
        const tMinYFinal = dir[1] >= 0 ? tMinY : tMaxY;
        const tMaxYFinal = dir[1] >= 0 ? tMaxY : tMinY;
        const tMinZFinal = dir[2] >= 0 ? tMinZ : tMaxZ;
        const tMaxZFinal = dir[2] >= 0 ? tMaxZ : tMinZ;

        // Find the largest minimum and smallest maximum
        const tMin = Math.max(tMinXFinal, tMinYFinal, tMinZFinal);
        const tMax = Math.min(tMaxXFinal, tMaxYFinal, tMaxZFinal);

        // Check if intersection exists
        if (tMax < tMin || tMax < 0) {
            return -1;
        }

        // If tMin is negative, the line starts inside the box
        const alpha = tMin < 0 ? 0 : tMin;

        // Check if the intersection point is within the line segment (0-1)
        if (alpha > 1) {
            return -1;
        }

        return alpha;
    };
}