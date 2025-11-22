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

import { ResourceComponents } from "../store/resource-components.js";
import { Store } from "../store/index.js";
import { Database, ToTransactionFunctions, TransactionDeclarations } from "./database.js";
import { StringKeyof } from "../../types/types.js";
import { isPromise } from "../../internal/promise/is-promise.js";
import { isAsyncGenerator } from "../../internal/async-generator/is-async-generator.js";
import { Components } from "../store/components.js";
import { ArchetypeComponents } from "../store/archetype-components.js";
import { Service } from "../../service/service.js";
import { createReconcilingDatabase } from "./reconciling/create-reconciling-database.js";
import { TransactionEnvelope } from "./reconciling/reconciling-database.js";
import { SerializedReconcilingEntry } from "./reconciling/reconciling-entry.js";

export function createDatabase<
    const C extends Components,
    const R extends ResourceComponents,
    const A extends ArchetypeComponents<StringKeyof<C>>,
    const TD extends TransactionDeclarations<C, R, A>
>(
    store: Store<C, R, A>,
    transactionDeclarations: TD,
    now: () => number = Date.now,
): Database<C, R, A, ToTransactionFunctions<TD>> {
    type T = ToTransactionFunctions<TD> & Service;
    type TransactionName = Extract<keyof TD, string>;

    const reconcilingDatabase = createReconcilingDatabase(store, transactionDeclarations);

    const applyCore = reconcilingDatabase.apply;

    let nextTransactionId = 1;

    const applyEnvelope = (envelope: TransactionEnvelope<TransactionName>) => applyCore(envelope);

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
                const timestamp = now();
                applyEnvelope({
                    id: transactionId,
                    name,
                    args: payload,
                    time: -timestamp,
                });
            };

            const applyCommit = (payload: unknown) => {
                const timestamp = now();
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

    const {
        apply,
        cancel,
        observe,
        resources,
        toData: reconcilingToData,
        fromData: reconcilingFromData,
        ...storeMethods
    } = reconcilingDatabase;
    void apply;

    const toData = () => reconcilingToData();

    const fromData = (data: unknown) => {
        reconcilingFromData(data);

        let maxId = 0;
        if (typeof data === "object" && data !== null && "appliedEntries" in (data as Record<string, unknown>)) {
            const appliedEntriesData = (data as { appliedEntries?: SerializedReconcilingEntry[] }).appliedEntries;
            if (Array.isArray(appliedEntriesData)) {
                for (const entry of appliedEntriesData) {
                    const rawId = entry?.id;
                    if (rawId !== undefined) {
                        const idNumber = Number(rawId);
                        if (!Number.isNaN(idNumber)) {
                            maxId = Math.max(maxId, idNumber);
                        }
                    }
                }
            }
        }

        nextTransactionId = Math.max(nextTransactionId, maxId + 1);
    };

    const cancelReconcilingEntry = (id: number) => {
        cancel(id);
    };

    const database = {
        serviceName: "ecs-database-service",
        ...storeMethods,
        resources,
        transactions,
        observe,
        toData,
        fromData,
        cancelTransaction: cancelReconcilingEntry,
    } as Database<C, R, A, T>;

    return database;
}

