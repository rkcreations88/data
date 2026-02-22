// © 2026 Adobe. MIT License. See /LICENSE for details.

import { Observe } from "../../observe/index.js";
import type { Service } from "../index.js";
import type { Action } from "./action.js";
import type { ActionError } from "./action-error.js";
import type { AgenticServiceLinks } from "./agentic-service-links.js";
import type { State } from "./state.js";


/**
 * An agentic service provides a set of valid states and actions
 * which are conditionally available based upon the current state.
 * Optional links expose other agentic services (e.g. parent, children)
 * for navigation or delegation. Designed as a foundation for agentic
 * systems; MCP or other agentic protocols can be built on this interface.
 */
export interface AgenticService extends Service {

    states: Observe<{ [key: string]: State }>
    actions: Observe<{ [key: string]: Action }>
    execute: (action: string, input: unknown) => Promise<void | ActionError>
    /** When set, observable map of links to other agentic services (key → AgenticService). */
    links?: Observe<AgenticServiceLinks>

}

export * as AgenticService from "./public.js";
