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

import type { Line3 } from "./index.js";
import type { Vec3 } from "../vec3/index.js";
import { Vec3 as Vec3Namespace } from "../vec3/index.js";

// Line3 utility functions
export const interpolate = (line: Line3, alpha: number): Vec3 => {
    const a = line.a;
    const b = line.b;
    return [a[0] + alpha * (b[0] - a[0]), a[1] + alpha * (b[1] - a[1]), a[2] + alpha * (b[2] - a[2])];
};

/**
 * Calculates the alpha value (0-1) representing the closest point on a line to a given point.
 * 
 * @param line - The line segment
 * @param point - The point in 3D space
 * @returns Alpha value, usually between 0 and 1, where 0 is line.a and 1 is line.b
 */
export const closestPointOnLine = (line: Line3, point: Vec3): number => {
    const { a, b } = line;

    // Calculate the direction vector of the line
    const lineDirection = Vec3Namespace.subtract(b, a);

    // Calculate the vector from line start to the point
    const pointToStart = Vec3Namespace.subtract(point, a);

    // Calculate the dot product to find the projection
    const dotProduct = Vec3Namespace.dot(pointToStart, lineDirection);
    const lineLengthSquared = Vec3Namespace.dot(lineDirection, lineDirection);

    // Avoid division by zero
    if (lineLengthSquared === 0) {
        return 0;
    }

    // Calculate alpha (projection parameter)
    const alpha = dotProduct / lineLengthSquared;

    // Do not clamp alpha, it can be outside of [0, 1]
    // User can clamp after if they want to.
    return alpha;
};

export const subLine = (line: Line3, alpha: number, beta: number): Line3 => {
    return {
        a: interpolate(line, alpha),
        b: interpolate(line, beta),
    };
};

/**
 * Returns a unit vector pointing from line.a to line.b. If the line has zero length,
 * returns the provided default direction (defaults to [0,0,1]).
 */
export const direction = (line: Line3): Vec3 => {
    const delta = Vec3Namespace.subtract(line.b, line.a);
    const len = Vec3Namespace.length(delta);
    return len === 0 ? [0, 0, 1] : Vec3Namespace.normalize(delta);
};

