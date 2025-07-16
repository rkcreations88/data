import { TypedBuffer } from "./typed-buffer.js";

export function isTypedBuffer(data: any): data is TypedBuffer<any> {
    return data && typeof data === "object" && "type" in data && "size" in data && "get" in data && "slice" in data;
}