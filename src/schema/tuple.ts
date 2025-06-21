import { Schema } from "./schema.js";

export function Tuple<T extends Schema, N extends number>(items: T, length: N) {
  return { type: "array", items, minItems: length, maxItems: length } as const satisfies Schema;
}
