import { Schema } from "./schema.js";
import { ToType } from "./to-type.js";

export type FromSchemas<T extends Record<string, Schema>> = {
  [K in Extract<keyof T, string>]: ToType<T[K]>;
};
