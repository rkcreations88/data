import { F32Schema } from "./f32.js";
import { FromSchema } from "./schema.js";

export const TimeSchema = F32Schema;
export type Time = FromSchema<typeof TimeSchema>;
