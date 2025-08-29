import { BlobHandle } from "./blob-handle.js";

export type UploadHandle = BlobHandle & { upload: true }
