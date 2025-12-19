/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

import { ResourceComponents } from "../../store/resource-components.js";
import { Store } from "../../store/index.js";
import type { Database } from "../database.js";
import type { ToActionFunctions, ActionDeclarations } from "../../store/action-functions.js";
import { StringKeyof } from "../../../types/types.js";
import { isPromise } from "../../../internal/promise/is-promise.js";
import { isAsyncGenerator } from "../../../internal/async-generator/is-async-generator.js";
import { Components } from "../../store/components.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { Service } from "../../../service/service.js";
import { createReconcilingDatabase } from "../reconciling/create-reconciling-database.js";
import { TransactionEnvelope } from "../reconciling/reconciling-database.js";
import { ComponentSchemas } from "../../component-schemas.js";
import { ResourceSchemas } from "../../resource-schemas.js";
import { FromSchemas } from "../../../schema/from-schemas.js";

export function createDatabase<
    CS extends ComponentSchemas,
    RS extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<CS>>,
    TD extends ActionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>
>(schema: Database.Schema<CS, RS, A, TD>): Database<FromSchemas<CS>, FromSchemas<RS>, A, ToActionFunctions<TD>>
export function createDatabase<
    const C extends Components,
    const R extends ResourceComponents,
    const A extends ArchetypeComponents<StringKeyof<C>>,
    const TD extends ActionDeclarations<C, R, A>
>(
    store: Store<C, R, A>,
    transactionDeclarations: TD,
): Database<C, R, A, ToActionFunctions<TD>>
export function createDatabase(
    storeOrSchema: Store<any, any, any> | Database.Schema<any, any, any, any>,
    transactionDeclarations?: any,
): any {
    if (transactionDeclarations) {
        return createDatabaseFromStoreAndTransactions(storeOrSchema as any, transactionDeclarations);
    } else {
        return createDatabaseFromSchema(storeOrSchema as any);
    }
}

function createDatabaseFromSchema<
    CS extends ComponentSchemas,
    RS extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<CS>>,
    TD extends ActionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>
>(schema: Database.Schema<CS, RS, A, TD>): Database<FromSchemas<CS>, FromSchemas<RS>, A, ToActionFunctions<TD>> {
    return createDatabase(Store.create(schema), schema.transactions);
}

function createDatabaseFromStoreAndTransactions<
    const C extends Components,
    const R extends ResourceComponents,
    const A extends ArchetypeComponents<StringKeyof<C>>,
    const TD extends ActionDeclarations<C, R, A>
>(
    store: Store<C, R, A>,
    transactionDeclarations: TD,
): Database<C, R, A, ToActionFunctions<TD>> {
    type T = ToActionFunctions<TD> & Service;
    type TransactionName = Extract<keyof TD, string>;

    const reconcilingDatabase = createReconcilingDatabase(store, transactionDeclarations);

    let nextTransactionId = 1;

    const applyEnvelope = (envelope: TransactionEnvelope<TransactionName>) => reconcilingDatabase.apply(envelope);

    const createTransactionWrapper = (name: TransactionName) => (args: unknown) => {
        const transactionId = nextTransactionId;
        nextTransactionId += 1;

        let hasTransient = false;

        const applyTransient = (payload: unknown) => {
            hasTransient = true;
            const timestamp = Date.now();
            applyEnvelope({
                id: transactionId,
                name,
                args: payload,
                time: -timestamp,
            });
        };

        const applyCommit = (payload: unknown) => {
            const timestamp = Date.now();
            const result = applyEnvelope({
                id: transactionId,
                name,
                args: payload,
                time: timestamp,
            });
            hasTransient = false;
            return result;
        };

        const cancelPending = () => {
            if (!hasTransient) {
                return;
            }
            applyEnvelope({
                id: transactionId,
                name,
                args: undefined,
                time: 0,
            });
            hasTransient = false;
        };

        if (typeof args === "function") {
            const asyncArgsProvider = args as () => Promise<unknown> | AsyncGenerator<unknown>;
            const providerResult = asyncArgsProvider();

            if (isAsyncGenerator(providerResult)) {
                return new Promise((resolve, reject) => {
                    (async () => {
                        let lastArgs: unknown;
                        try {
                            let iteration = await providerResult.next();

                            while (!iteration.done) {
                                lastArgs = iteration.value;
                                applyTransient(iteration.value);
                                iteration = await providerResult.next();
                            }

                            const finalArgs = iteration.value !== undefined ? iteration.value : lastArgs;

                            if (finalArgs !== undefined) {
                                const commitResult = applyCommit(finalArgs);
                                resolve(commitResult?.value);
                            } else {
                                cancelPending();
                                resolve(undefined);
                            }
                        } catch (error) {
                            cancelPending();
                            reject(error);
                        }
                    })();
                });
            }

            if (isPromise(providerResult)) {
                return (async () => {
                    try {
                        const resolved = await providerResult;
                        const commitResult = applyCommit(resolved);
                        return commitResult?.value;
                    } catch (error) {
                        cancelPending();
                        throw error;
                    }
                })();
            }

            const syncResult = applyCommit(providerResult);
            return syncResult?.value;
        }

        const result = applyCommit(args);
        return result?.value;
    };

    const transactions = {
        serviceName: "ecs-database-transactions-service",
    } satisfies Service as T;

    // Create unwrapped actions that execute directly on the store
    const actions = {} as T;
    for (const name of Object.keys(transactionDeclarations)) {
        (actions as any)[name] = transactionDeclarations[name].bind(null, store);
    }

    // Assign unwrapped actions to store
    (store as any).actions = actions;

    const addTransactionWrappers = (transactionDecls: Record<string, any>) => {
        for (const name of Object.keys(transactionDecls)) {
            (transactions as any)[name] = createTransactionWrapper(name as any);
        }
    };

    addTransactionWrappers(transactionDeclarations);

    const extend = <
        S extends Database.Schema<any, any, any, any>
    >(
        schema: S,
    ) => {
        // Delegate to reconcilingDatabase which handles store/transactionalStore extension
        reconcilingDatabase.extend(schema);
        // Add transaction wrappers for the new transactions
        addTransactionWrappers(schema.transactions);

        // Add unwrapped actions to store.actions
        for (const name of Object.keys(schema.transactions)) {
            ((store as any).actions as any)[name] = schema.transactions[name].bind(null, store);
        }

        return database as unknown as Database<
            C & (S extends Database.Schema<infer XC, any, any, any> ? FromSchemas<XC> : never),
            R & (S extends Database.Schema<any, infer XR, any, any> ? FromSchemas<XR> : never),
            A & (S extends Database.Schema<any, any, infer XA, any> ? XA : never),
            T & (S extends Database.Schema<any, any, any, infer XTD> ? ToActionFunctions<XTD> : never)
        >;
    };

    const database = {
        serviceName: "ecs-database-service",
        ...reconcilingDatabase,
        store: store as Store<C, R, A> & { readonly actions: T },
        transactions,
        extend,
    } as Database<C, R, A, T> & { extend: typeof extend };

    return database;
}

