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
import type { Database, ToTransactionFunctions, TransactionDeclarations } from "../database.js";
import { StringKeyof } from "../../../types/types.js";
import { isPromise } from "../../../internal/promise/is-promise.js";
import { isAsyncGenerator } from "../../../internal/async-generator/is-async-generator.js";
import { Components } from "../../store/components.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { Service } from "../../../service/service.js";
import { createReconcilingDatabase } from "../reconciling/create-reconciling-database.js";
import { TransactionEnvelope } from "../reconciling/reconciling-database.js";

export function createDatabase<
    const C extends Components,
    const R extends ResourceComponents,
    const A extends ArchetypeComponents<StringKeyof<C>>,
    const TD extends TransactionDeclarations<C, R, A>
>(
    store: Store<C, R, A>,
    transactionDeclarations: TD,
): Database<C, R, A, ToTransactionFunctions<TD>> {
    type T = ToTransactionFunctions<TD> & Service;
    type TransactionName = Extract<keyof TD, string>;

    const reconcilingDatabase = createReconcilingDatabase(store, transactionDeclarations);

    let nextTransactionId = 1;

    const applyEnvelope = (envelope: TransactionEnvelope<TransactionName>) => reconcilingDatabase.apply(envelope);

    const transactions = {
        serviceName: "ecs-database-transactions-service",
    } satisfies Service as T;

    for (const name of Object.keys(transactionDeclarations) as TransactionName[]) {
        (transactions as any)[name as keyof T] = (args: unknown) => {
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
    }


    const extend = <
        S extends Store.Schema<any, any, any>
    >(
        schema: S,
    ) => {
        store.extend(schema as Store.Schema<any, any, any>);
        return database as unknown as Database<
            C & (S extends Store.Schema<infer XC, infer XR, infer XA> ? XC : never),
            R & (S extends Store.Schema<infer XC, infer XR, infer XA> ? XR : never),
            A & (S extends Store.Schema<infer XC, infer XR, infer XA> ? XA : never),
            ToTransactionFunctions<TD>
        >;
    };

    const database = {
        serviceName: "ecs-database-service",
        ...reconcilingDatabase,
        transactions,
        extend,
    } as Database<C, R, A, T> & { extend: typeof extend };

    return database;
}

