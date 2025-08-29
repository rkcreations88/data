import { FromSchema, Schema } from "../schema/schema.js";
import { BlobMeta, BlobMetaSchema } from "./blob-meta.js";

type UTCString = string;

export const BlobHandleSchema = {
    type: 'object',
    properties: {
        ...BlobMetaSchema.properties,
        handle: { type: 'string' },
        expires: { type: 'string' },
    },
    required: [...BlobMetaSchema.required, 'handle'],
} as const satisfies Schema;

export type BlobHandle = FromSchema<typeof BlobHandleSchema>;