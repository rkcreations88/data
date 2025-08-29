import { BlobHandle } from "./blob-handle.js";

export type DownloadHandle = BlobHandle & { download: true }
