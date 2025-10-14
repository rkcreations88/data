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
import { AabbFace } from './aabb-face.js';

describe('AabbFace', () => {
    it('should get correct opposite faces', () => {
        expect(AabbFace.getOpposite(AabbFace.POS_Z)).toBe(AabbFace.NEG_Z);
        expect(AabbFace.getOpposite(AabbFace.POS_X)).toBe(AabbFace.NEG_X);
        expect(AabbFace.getOpposite(AabbFace.POS_Y)).toBe(AabbFace.NEG_Y);
    });

    it('should get correct adjacent faces for each axis', () => {
        const posZAdjacent = AabbFace.getAdjacent(AabbFace.POS_Z);
        expect(posZAdjacent).toEqual([AabbFace.POS_X, AabbFace.NEG_X, AabbFace.POS_Y, AabbFace.NEG_Y]);
        
        const posXAdjacent = AabbFace.getAdjacent(AabbFace.POS_X);
        expect(posXAdjacent).toEqual([AabbFace.POS_Z, AabbFace.NEG_Z, AabbFace.POS_Y, AabbFace.NEG_Y]);
        
        const posYAdjacent = AabbFace.getAdjacent(AabbFace.POS_Y);
        expect(posYAdjacent).toEqual([AabbFace.POS_Z, AabbFace.NEG_Z, AabbFace.POS_X, AabbFace.NEG_X]);
    });

    it('should throw error for invalid face indices', () => {
        expect(() => AabbFace.getNormal(6 as any)).toThrow('Invalid face index: 6');
        expect(() => AabbFace.getOpposite(6 as any)).toThrow('Invalid face index: 6');
        expect(() => AabbFace.getAdjacent(6 as any)).toThrow('Invalid face index: 6');
    });

    it('should determine face from position correctly', () => {
        const aabb = { min: [-1, -1, -1] as const, max: [1, 1, 1] as const }; // Unit cube centered at origin
        
        // Test positions on each face
        expect(AabbFace.fromPosition([1, 0, 0], aabb)).toBe(AabbFace.POS_X);
        expect(AabbFace.fromPosition([-1, 0, 0], aabb)).toBe(AabbFace.NEG_X);
        expect(AabbFace.fromPosition([0, 1, 0], aabb)).toBe(AabbFace.POS_Y);
        expect(AabbFace.fromPosition([0, -1, 0], aabb)).toBe(AabbFace.NEG_Y);
        expect(AabbFace.fromPosition([0, 0, 1], aabb)).toBe(AabbFace.POS_Z);
        expect(AabbFace.fromPosition([0, 0, -1], aabb)).toBe(AabbFace.NEG_Z);
    });
});
