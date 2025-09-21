import { FromSchema, Schema } from "../../schema/schema.js";

export const SystemPhaseSchema = {
    enum: [
        "input",
     
        "preUpdate",
        "update",
        "physics",
        "postUpdate",

        "preRender",
        "render",
        "postRender",
     
        "cleanup",
    ]
} as const satisfies Schema;

export type SystemPhase = FromSchema<typeof SystemPhaseSchema>;
