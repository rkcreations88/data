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


import type { Quat } from './quat.js';
import { Vec3 } from '../index.js';
import { Mat4x4 } from '../index.js';

// Basic Quaternion Operations
export const add = ([x1, y1, z1, w1]: Quat, [x2, y2, z2, w2]: Quat): Quat => [
    x1 + x2,
    y1 + y2,
    z1 + z2,
    w1 + w2
];

export const subtract = ([x1, y1, z1, w1]: Quat, [x2, y2, z2, w2]: Quat): Quat => [
    x1 - x2,
    y1 - y2,
    z1 - z2,
    w1 - w2
];

export const scale = ([x, y, z, w]: Quat, s: number): Quat => [x * s, y * s, z * s, w * s];

export const negate = ([x, y, z, w]: Quat): Quat => [-x, -y, -z, -w];

export const conjugate = ([x, y, z, w]: Quat): Quat => [-x, -y, -z, w];

export const multiply = ([x1, y1, z1, w1]: Quat, [x2, y2, z2, w2]: Quat): Quat => [
    x1 * w2 + w1 * x2 + y1 * z2 - z1 * y2,
    y1 * w2 + w1 * y2 + z1 * x2 - x1 * z2,
    z1 * w2 + w1 * z2 + x1 * y2 - y1 * x2,
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
];

// Geometric Functions
export const length = ([x, y, z, w]: Quat): number => Math.sqrt(x * x + y * y + z * z + w * w);

export const lengthSquared = ([x, y, z, w]: Quat): number => x * x + y * y + z * z + w * w;

export const normalize = (q: Quat): Quat => {
    const len = length(q);
    return len === 0 ? [0, 0, 0, 1] : scale(q, 1 / len);
};

export const dot = ([x1, y1, z1, w1]: Quat, [x2, y2, z2, w2]: Quat): number =>
    x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2;

export const distance = (a: Quat, b: Quat): number => length(subtract(b, a));

// Rotation Functions
export const fromAxisAngle = (axis: Vec3, angle: number): Quat => {
    const halfAngle = angle * 0.5;
    const s = Math.sin(halfAngle);
    const c = Math.cos(halfAngle);
    return [axis[0] * s, axis[1] * s, axis[2] * s, c];
};

export const toAxisAngle = ([x, y, z, w]: Quat): { axis: Vec3; angle: number } => {
    const angle = 2 * Math.acos(Math.abs(w));
    const s = Math.sin(angle * 0.5);
    if (s === 0) {
        return { axis: [0, 0, 1], angle: 0 };
    }
    return {
        axis: [x / s, y / s, z / s],
        angle: w < 0 ? -angle : angle
    };
};

export const fromEuler = (x: number, y: number, z: number): Quat => {
    const cx = Math.cos(x * 0.5);
    const sx = Math.sin(x * 0.5);
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cz = Math.cos(z * 0.5);
    const sz = Math.sin(z * 0.5);

    return [
        sx * cy * cz - cx * sy * sz,
        cx * sy * cz + sx * cy * sz,
        cx * cy * sz - sx * sy * cz,
        cx * cy * cz + sx * sy * sz
    ];
};

export const toEuler = ([x, y, z, w]: Quat): Vec3 => {
    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (y-axis rotation)
    const sinp = 2 * (w * y - z * x);
    let pitch;
    if (Math.abs(sinp) >= 1) {
        pitch = Math.sign(sinp) * Math.PI / 2; // use 90 degrees if out of range
    } else {
        pitch = Math.asin(sinp);
    }

    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return [roll, pitch, yaw];
};

// Vector Rotation
export const rotateVec3 = ([x, y, z, w]: Quat, v: Vec3): Vec3 => {
    // q * v * q^-1
    const qv: Vec3 = [x, y, z];
    const uv = Vec3.cross(qv, v);
    const uuv = Vec3.cross(qv, uv);
    const scaleFactor = 2 * w;
    return [
        v[0] + scaleFactor * uv[0] + 2 * uuv[0],
        v[1] + scaleFactor * uv[1] + 2 * uuv[1],
        v[2] + scaleFactor * uv[2] + 2 * uuv[2]
    ];
};

// Interpolation
export const slerp = (q1: Quat, q2: Quat, t: number): Quat => {
    const dotProduct = dot(q1, q2);

    // If the dot product is negative, slerp won't take the shorter route
    const q2Adjusted = dotProduct < 0 ? negate(q2) : q2;
    const adjustedDot = Math.abs(dotProduct);

    // If the inputs are too close for comfort, linearly interpolate
    if (adjustedDot > 0.9995) {
        return normalize(add(scale(q1, 1 - t), scale(q2Adjusted, t)));
    }

    const theta = Math.acos(adjustedDot);
    const sinTheta = Math.sin(theta);
    const factor1 = Math.sin((1 - t) * theta) / sinTheta;
    const factor2 = Math.sin(t * theta) / sinTheta;

    return normalize(add(scale(q1, factor1), scale(q2Adjusted, factor2)));
};

export const lerp = (q1: Quat, q2: Quat, t: number): Quat => {
    return normalize(add(scale(q1, 1 - t), scale(q2, t)));
};

// Matrix Conversion
export const toMat4 = ([x, y, z, w]: Quat): Mat4x4 => {
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const xy = x * y;
    const xz = x * z;
    const yz = y * z;
    const wx = w * x;
    const wy = w * y;
    const wz = w * z;

    return [
        1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
        2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
        2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
        0, 0, 0, 1
    ];
};

// Utility Functions
export const identity = (): Quat => [0, 0, 0, 1];

export const inverse = (q: Quat): Quat => {
    const lenSq = lengthSquared(q);
    if (lenSq === 0) return [0, 0, 0, 1];
    return scale(conjugate(q), 1 / lenSq);
};

export const lookAt = (forward: Vec3, up: Vec3): Quat => {
    // Normalize forward vector
    const f = Vec3.normalize(forward);

    // Calculate right vector
    const r = Vec3.normalize(Vec3.cross(f, up));

    // Recalculate up vector
    const u = Vec3.cross(r, f);

    // Convert to quaternion
    const trace = r[0] + u[1] + f[2];

    if (trace > 0) {
        const s = Math.sqrt(trace + 1) * 2;
        return [
            (u[2] - f[1]) / s,
            (f[0] - r[2]) / s,
            (r[1] - u[0]) / s,
            0.25 * s
        ];
    } else if (r[0] > u[1] && r[0] > f[2]) {
        const s = Math.sqrt(1 + r[0] - u[1] - f[2]) * 2;
        return [
            0.25 * s,
            (u[0] + r[1]) / s,
            (f[0] + r[2]) / s,
            (u[2] - f[1]) / s
        ];
    } else if (u[1] > f[2]) {
        const s = Math.sqrt(1 + u[1] - r[0] - f[2]) * 2;
        return [
            (u[0] + r[1]) / s,
            0.25 * s,
            (f[1] + u[2]) / s,
            (f[0] - r[2]) / s
        ];
    } else {
        const s = Math.sqrt(1 + f[2] - r[0] - u[1]) * 2;
        return [
            (f[0] + r[2]) / s,
            (f[1] + u[2]) / s,
            0.25 * s,
            (r[1] - u[0]) / s
        ];
    }
};
