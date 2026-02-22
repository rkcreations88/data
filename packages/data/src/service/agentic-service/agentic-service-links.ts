// © 2026 Adobe. MIT License. See /LICENSE for details.

import type { AgenticService } from "./agentic-service.js";

/** Map of link key → agentic service. In a separate file so declaration emit does not use a private name (TS4033/TS4049). */
export type AgenticServiceLinks = { [key: string]: AgenticService };
