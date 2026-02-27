// © 2026 Adobe. MIT License. See /LICENSE for details.

import { Observe } from "../../observe/index.js";
import { Schema } from "../../schema/index.js";
import { AgenticService } from "./agentic-service.js";
import type { AgenticServiceLinks } from "./agentic-service-links.js";

/** State declaration: kind + schema for value + description */
type StateDeclaration<S extends Schema = Schema> = {
    type: "state";
    schema: S;
    description: string;
};

/** Action declaration: kind + description + optional input schema */
type ActionDeclaration<I extends Schema | false | undefined = undefined> = {
    type: "action";
    description: string;
    input?: I;
};

/** Link declaration: kind + optional description */
type LinkDeclaration = {
    type: "link";
    description?: string;
};

type DeclarationEntry = StateDeclaration | ActionDeclaration<Schema | false | undefined> | LinkDeclaration;
type Declarations = Record<string, DeclarationEntry>;

type ConditionalFromDeclarations<D extends Declarations> = Partial<{
    [K in keyof D]: Observe<boolean>;
}>;

function getActionSchema(entry: ActionDeclaration<Schema | false | undefined>): Schema | false {
    return entry.input ?? false;
}

/**
 * Creates an AgenticService from a config with interface, implementation, and optional conditional.
 *
 * Interface: flat map of declarations. Each entry has type "state" | "action" | "link":
 * - state: { type: "state", schema, description } → implementation: Observe<value>
 * - action: { type: "action", description, input? } → implementation: (input?) => ...
 * - link: { type: "link", description? } → implementation: AgenticService | Observe<AgenticService>
 * Conditional: optional per-key Observe<boolean> for enablement (applies to states, actions, and links).
 */
export function create<const D extends Declarations>(config: {
    interface: D;
    implementation: ImplementationFromDeclarations<D>;
    conditional?: ConditionalFromDeclarations<D>;
}): AgenticService {
    const { interface: iface, implementation, conditional } = config;
    const alwaysEnabled = Observe.fromConstant(true);

    const stateKeys: string[] = [];
    const actionKeys: string[] = [];
    const linkKeys: string[] = [];
    const stateSchemas: Record<string, Schema> = {};
    const actionMeta: Record<string, { description: string; schema: Schema | false; execute: Function }> = {};

    for (const [key, entry] of Object.entries(iface)) {
        if (entry.type === "state") {
            stateKeys.push(key);
            stateSchemas[key] = entry.schema;
        } else if (entry.type === "action") {
            actionKeys.push(key);
            actionMeta[key] = {
                description: entry.description,
                schema: getActionSchema(entry),
                execute: (implementation as Record<string, Function>)[key],
            };
        } else if (entry.type === "link") {
            linkKeys.push(key);
        }
    }

    const perStateObservables: Record<string, Observe<unknown>> = {};
    for (const key of stateKeys) {
        const valueObs = (implementation as Record<string, Observe<unknown>>)[key];
        const enabledObs = conditional?.[key as keyof typeof conditional] ?? alwaysEnabled;
        perStateObservables[key] = Observe.fromProperties({
            enabled: enabledObs,
            value: valueObs,
        });
    }

    const enabledObservables: Record<string, Observe<unknown>> = {};
    for (const key of actionKeys) {
        enabledObservables[key] = conditional?.[key as keyof typeof conditional] ?? alwaysEnabled;
    }

    const implRecord = implementation as Record<string, unknown>;
    const perLinkObservables: Record<string, Observe<{ enabled: boolean; value: AgenticService }>> = {};
    for (const key of linkKeys) {
        const raw = implRecord[key] as AgenticService | Observe<AgenticService>;
        const linkObs = typeof raw === "function" ? raw : Observe.fromConstant(raw);
        const enabledObs = conditional?.[key as keyof typeof conditional] ?? alwaysEnabled;
        perLinkObservables[key] = Observe.withMap(
            Observe.fromProperties({ enabled: enabledObs, value: linkObs }),
            (x) => x as { enabled: boolean; value: AgenticService }
        );
    }

    const states: Observe<{ [key: string]: AgenticService.State }> = Observe.withMap(
        Observe.fromProperties(perStateObservables),
        (raw) => {
            const result: { [key: string]: AgenticService.State } = {};
            for (const [key, entry] of Object.entries(raw)) {
                const { enabled, value } = entry as { enabled: boolean; value: unknown };
                if (enabled) {
                    result[key] = { schema: stateSchemas[key], value } as AgenticService.State;
                }
            }
            return result;
        }
    );

    const actions: Observe<{ [key: string]: AgenticService.Action }> = Observe.withMap(
        Observe.fromProperties(enabledObservables),
        (enabledMap) => {
            const result: { [key: string]: AgenticService.Action } = {};
            for (const [key, enabled] of Object.entries(enabledMap)) {
                if (!enabled) continue;
                const meta = actionMeta[key];
                if (meta) result[key] = meta as AgenticService.Action;
            }
            return result;
        }
    );

    let currentActions: { [key: string]: AgenticService.Action } = {};
    actions((a) => { currentActions = a; });

    const execute = async (actionName: string, input: unknown): Promise<void | AgenticService.Error> => {
        const entry = currentActions[actionName];
        if (!entry) return `Action "${actionName}" is not available`;
        return (entry.execute as Function)(input);
    };

    const links: Observe<AgenticServiceLinks> | undefined =
        linkKeys.length > 0
            ? Observe.withMap(Observe.fromProperties(perLinkObservables), (raw) => {
                const result: AgenticServiceLinks = {};
                for (const [key, entry] of Object.entries(raw)) {
                    const { enabled, value } = entry as { enabled: boolean; value: AgenticService };
                    if (enabled && value) result[key] = value;
                }
                return result;
            })
            : undefined;
    return {
        serviceName: "agentic-service",
        states,
        actions,
        execute,
        ...(links !== undefined && { links }),
    };
}

/** Implementation map derived from interface: state → Observe, action → execute fn, link → AgenticService | Observe<AgenticService> */
export type ImplementationFromDeclarations<D extends Declarations> = {
    [K in keyof D]:
    D[K] extends { type: "state"; schema: infer S extends Schema }
    ? Observe<Schema.ToType<S>>
    : D[K] extends { type: "action"; input?: infer I extends Schema | false | undefined }
    ? ExecuteFromSchema<I extends undefined ? false : I>
    : D[K] extends { type: "link" }
    ? AgenticService | Observe<AgenticService>
    : never;
};

type ExecuteFromSchema<S extends Schema | false> =
    S extends false
    ? (() => Promise<void | AgenticService.ActionError> | void)
    : ((input: Schema.ToType<S>) => Promise<void | AgenticService.ActionError> | void);
