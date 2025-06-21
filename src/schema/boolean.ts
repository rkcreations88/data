import { Schema } from "@cfworker/json-schema";

export const BooleanSchema = {
    type: 'boolean',
} as const satisfies Schema;
