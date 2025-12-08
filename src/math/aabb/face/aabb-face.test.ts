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

import { describe, it, expect } from 'vitest';
import { Aabb } from '../index.js';

const Face = Aabb.Face;

describe('Aabb.Face', () => {
    it('should get correct opposite faces', () => {
        expect(Face.getOpposite(Face.POS_Z)).toBe(Face.NEG_Z);
        expect(Face.getOpposite(Face.POS_X)).toBe(Face.NEG_X);
        expect(Face.getOpposite(Face.POS_Y)).toBe(Face.NEG_Y);
    });

    it('should get correct adjacent faces for each axis', () => {
        const posZAdjacent = Face.getAdjacent(Face.POS_Z);
        expect(posZAdjacent).toEqual([Face.POS_X, Face.NEG_X, Face.POS_Y, Face.NEG_Y]);
        
        const posXAdjacent = Face.getAdjacent(Face.POS_X);
        expect(posXAdjacent).toEqual([Face.POS_Z, Face.NEG_Z, Face.POS_Y, Face.NEG_Y]);
        
        const posYAdjacent = Face.getAdjacent(Face.POS_Y);
        expect(posYAdjacent).toEqual([Face.POS_Z, Face.NEG_Z, Face.POS_X, Face.NEG_X]);
    });

    it('should throw error for invalid face indices', () => {
        expect(() => Face.getNormal(6 as any)).toThrow('Invalid face index: 6');
        expect(() => Face.getOpposite(6 as any)).toThrow('Invalid face index: 6');
        expect(() => Face.getAdjacent(6 as any)).toThrow('Invalid face index: 6');
    });

    it('should determine face from position correctly', () => {
        const aabb = { min: [-1, -1, -1] as const, max: [1, 1, 1] as const }; // Unit cube centered at origin
        
        // Test positions on each face
        expect(Face.fromPosition([1, 0, 0], aabb)).toBe(Face.POS_X);
        expect(Face.fromPosition([-1, 0, 0], aabb)).toBe(Face.NEG_X);
        expect(Face.fromPosition([0, 1, 0], aabb)).toBe(Face.POS_Y);
        expect(Face.fromPosition([0, -1, 0], aabb)).toBe(Face.NEG_Y);
        expect(Face.fromPosition([0, 0, 1], aabb)).toBe(Face.POS_Z);
        expect(Face.fromPosition([0, 0, -1], aabb)).toBe(Face.NEG_Z);
    });
});
