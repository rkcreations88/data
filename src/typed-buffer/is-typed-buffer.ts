import { TypedBuffer } from "./typed-buffer.js";

export function isTypedBuffer(x: unknown): x is TypedBuffer<unknown> {
    return x instanceof TypedBuffer;
}
