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


import { Line3 } from "./line3.js";
import { Vec3 } from "../index.js";

/**
 * Calculates the alpha value (0-1) representing the closest point on a line to a given point.
 * 
 * @param line - The line segment
 * @param point - The point in 3D space
 * @returns Alpha value, usually between 0 and 1, where 0 is line.a and 1 is line.b
 */
export function closestPointOnLine(line: Line3, point: Vec3): number {
    const { a, b } = line;

    // Calculate the direction vector of the line
    const lineDirection = Vec3.subtract(b, a);

    // Calculate the vector from line start to the point
    const pointToStart = Vec3.subtract(point, a);

    // Calculate the dot product to find the projection
    const dotProduct = Vec3.dot(pointToStart, lineDirection);
    const lineLengthSquared = Vec3.dot(lineDirection, lineDirection);

    // Avoid division by zero
    if (lineLengthSquared === 0) {
        return 0;
    }

    // Calculate alpha (projection parameter)
    const alpha = dotProduct / lineLengthSquared;

    // Do not clamp alpha, it can be outside of [0, 1]
    // User can clamp after if they want to.
    return alpha;
} 