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
import { Vec3, Aabb } from "../index.js";

export type AabbFace = FromSchema<typeof AabbFace.schema>;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AabbFace {
    export const schema = {
        type: 'number',
        minimum: 0,
        maximum: 5,
    } as const satisfies Schema;

    /**
     * AABB face direction constants for cube faces
     */
    export const POS_Z = 0 as const;
    export const POS_X = 1 as const;
    export const NEG_Z = 2 as const;
    export const NEG_X = 3 as const;
    export const POS_Y = 4 as const;
    export const NEG_Y = 5 as const;

    /**
     * Array of all face directions
     */
    export const ALL_FACES = [POS_Z, POS_X, NEG_Z, NEG_X, POS_Y, NEG_Y] as const;

    /**
     * AABB face direction names for debugging/logging
     */
    export const FACE_NAMES = [
        'POS_Z', 'POS_X', 'NEG_Z', 'NEG_X', 'POS_Y', 'NEG_Y'
    ] as const;

    /**
     * Get the AABB face name for debugging/logging
     */
    export const getName = (face: AabbFace): string => {
        return FACE_NAMES[face];
    };

    /**
     * Get the normal vector for a given AABB face
     */
    export const getNormal = (face: AabbFace): Vec3 => {
        switch (face) {
            case POS_Z: return [0, 0, 1];
            case NEG_Z: return [0, 0, -1];
            case POS_X: return [1, 0, 0];
            case NEG_X: return [-1, 0, 0];
            case POS_Y: return [0, 1, 0];
            case NEG_Y: return [0, -1, 0];
            default: throw new Error(`Invalid face index: ${face}`);
        }
    };

    /**
     * Get the opposite AABB face
     */
    export const getOpposite = (face: AabbFace): AabbFace => {
        switch (face) {
            case POS_Z: return NEG_Z;
            case NEG_Z: return POS_Z;
            case POS_X: return NEG_X;
            case NEG_X: return POS_X;
            case POS_Y: return NEG_Y;
            case NEG_Y: return POS_Y;
            default: throw new Error(`Invalid face index: ${face}`);
        }
    };

    /**
     * Check if two AABB faces are opposite
     */
    export const isOpposite = (face1: AabbFace, face2: AabbFace): boolean => {
        return getOpposite(face1) === face2;
    };

    /**
     * Get all AABB faces adjacent to the given face (faces that share an edge)
     */
    export const getAdjacent = (face: AabbFace): readonly AabbFace[] => {
        switch (face) {
            case POS_Z:
            case NEG_Z:
                return [POS_X, NEG_X, POS_Y, NEG_Y];
            case POS_X:
            case NEG_X:
                return [POS_Z, NEG_Z, POS_Y, NEG_Y];
            case POS_Y:
            case NEG_Y:
                return [POS_Z, NEG_Z, POS_X, NEG_X];
            default:
                throw new Error(`Invalid face index: ${face}`);
        }
    };

    /**
     * Check if two AABB faces are adjacent (share an edge)
     */
    export const isAdjacent = (face1: AabbFace, face2: AabbFace): boolean => {
        return getAdjacent(face1).includes(face2);
    };

    /**
     * Determines which AABB face a position is closest to.
     * Assumes the position is in normalized coordinate space - a cube with size 1 centered on the origin.
     * @param position World position of the intersection point
     * @param aabb Bounding box of the cube
     * @returns AabbFace index: 0=POS_Z, 1=POS_X, 2=NEG_Z, 3=NEG_X, 4=POS_Y, 5=NEG_Y
     */
    export const fromPosition = (position: Vec3, aabb: Aabb): AabbFace => {
        const aabbCenter = Aabb.center(aabb);
        const localPos = [
            position[0] - aabbCenter[0],
            position[1] - aabbCenter[1],
            position[2] - aabbCenter[2]
        ];

        // Find the face with the largest absolute coordinate (closest to cube surface)
        const absX = Math.abs(localPos[0]);
        const absY = Math.abs(localPos[1]);
        const absZ = Math.abs(localPos[2]);

        if (absX >= absY && absX >= absZ) {
            // X-axis face (NEG_X or POS_X)
            return localPos[0] > 0 ? POS_X : NEG_X;
        } else if (absY >= absZ) {
            // Y-axis face (NEG_Y or POS_Y)
            return localPos[1] > 0 ? POS_Y : NEG_Y;
        } else {
            // Z-axis face (NEG_Z or POS_Z)
            return localPos[2] > 0 ? POS_Z : NEG_Z;
        }
    };
}
