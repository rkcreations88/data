import { FromSchema, Schema } from "../schema/schema.js";

export const BlobMetaSchema = {
    type: 'object',
    properties: {
        type: { type: 'string' },
        size: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
        duration: { type: 'number' },
    },
    required: ['type', 'size'],
} as const satisfies Schema;

export type BlobMeta = FromSchema<typeof BlobMetaSchema>;
