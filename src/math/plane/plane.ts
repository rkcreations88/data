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
import { Vec3, F32, Line3, epsilon } from "../index.js";

export type Plane = FromSchema<typeof Plane.schema>;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Plane {
    export const schema = {
        type: 'object',
        properties: {
            normal: Vec3.schema,
            distance: F32.schema,
        },
        layout: 'std140',
        required: ['normal', 'distance'],
        additionalProperties: false,
    } as const satisfies Schema;

    export const layout = getStructLayout(schema);

    export function is(value: any): value is Plane {
        return value && typeof value === 'object' && 'normal' in value && 'distance' in value;
    }

    // Plane utility functions
    export const signedDistance = (plane: Plane, point: Vec3): number => 
        Vec3.dot(plane.normal, point) - plane.distance;

    export const distance = (plane: Plane, point: Vec3): number => 
        Math.abs(signedDistance(plane, point));

    export const containsPoint = (plane: Plane, point: Vec3): boolean => 
        Math.abs(signedDistance(plane, point)) < epsilon;

    export const isPointInFront = (plane: Plane, point: Vec3): boolean => 
        signedDistance(plane, point) > 0;

    export const isPointBehind = (plane: Plane, point: Vec3): boolean => 
        signedDistance(plane, point) < 0;

    /**
     * Find the intersection alpha between a line and a plane.
     * @param plane The plane to intersect with
     * @param line The line to intersect
     * @returns The alpha parameter (0-1 = within segment, <0 or >1 = outside segment), or null if line is parallel to plane
     */
    export const lineIntersection = (plane: Plane, line: Line3): number | null => {
        const { a, b } = line;
        
        // Calculate line direction vector
        const direction = Vec3.subtract(b, a);
        
        // Calculate denominator: dot(normal, direction)
        const denominator = Vec3.dot(plane.normal, direction);
        
        // If denominator is close to zero, line is parallel to plane
        if (Math.abs(denominator) < epsilon) {
            return null;
        }
        
        // Calculate numerator: dot(normal, a) - distance
        const numerator = Vec3.dot(plane.normal, a) - plane.distance;
        
        // Calculate parameter t (alpha)
        const alpha = -numerator / denominator;
        
        return alpha;
    };
}
