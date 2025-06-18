/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/
import { ArchetypeId } from "../archetype/index.js";
import { CoreComponents } from "../core-components.js";
import { ResourceComponents } from "../store/resource-components.js";
import { Store } from "../store/index.js";
import { Database, ToTransactionFunctions, TransactionDeclarations } from "./database.js";
import { Entity } from "../entity.js";
import { EntityValues } from "../store/core/index.js";
import { TransactionResult } from "./transactional-store/index.js";
import { mapEntries } from "../../types/object/index.js";
import { StringKeyof } from "../../types/types.js";
import { Observe, withMap } from "../../observe/index.js";
import { createTransactionalStore } from "./transactional-store/create-transactional-store.js";
import { isPromise } from "./is-promise.js";
import { isAsyncGenerator } from "./is-async-provider.js";

export function createDatabase<
    C extends CoreComponents,
    R extends ResourceComponents,
    TD extends TransactionDeclarations<C, R>
>(
    ds: Store<C, R>,
    transactionDeclarations: TD,
): Database<C, R, ToTransactionFunctions<TD>> {
    type T = ToTransactionFunctions<TD>;

    const transactionalStore = createTransactionalStore(ds);

    //  variables to track the observers
    const componentObservers = new Map<StringKeyof<C>, Set<() => void>>();
    const archetypeObservers = new Map<ArchetypeId, Set<() => void>>();
    const entityObservers = new Map<Entity, Set<(values: EntityValues<C> | null) => void>>();
    const transactionObservers = new Set<(transaction: TransactionResult<C>) => void>();

    //  observation interface
    const observeEntity = (entity: Entity) => (observer: (values: EntityValues<C> | null) => void) => {
        // Call immediately with current values
        observer(ds.read(entity));
        // Add to observers for future changes
        return addToMapSet(entity, entityObservers)(observer);
    };
    const observeArchetype = (archetype: ArchetypeId) => addToMapSet(archetype, archetypeObservers);
    const observeComponent = mapEntries(ds.componentSchemas, ([component]) => addToMapSet(component, componentObservers));
    
    // Resource observation - resources are stored as entities with specific archetypes
    const observeResource = Object.fromEntries(
        Object.entries(ds.resources).map(([resource]) => {
            const archetype = ds.ensureArchetype(["id" as StringKeyof<C>, resource as unknown as StringKeyof<C>]);
            const resourceId = archetype.columns.id.get(0);
            return [resource, withMap(observeEntity(resourceId), (values) => values?.[resource as unknown as StringKeyof<C>])];
        })
    ) as { [K in StringKeyof<R>]: Observe<R[K]>; };
    
    const observe: Database<C, R>["observe"] = {
        component: observeComponent,
        resource: observeResource,
        transactions: (notify) => {
            transactionObservers.add(notify);
            return () => {
                transactionObservers.delete(notify);
            }
        },
        entity: observeEntity,
        archetype: observeArchetype,
    };

    const { execute: transactionDatabaseExecute, resources, ...rest } = transactionalStore;

    const execute = (handler: (db: Store<C, R>) => void) => {
        const result = transactionDatabaseExecute(handler);
        
        // Notify transaction observers
        for (const transactionObserver of transactionObservers) {
            transactionObserver(result);
        }
        
        // Notify component observers
        for (const changedComponent of result.changedComponents) {
            const observers = componentObservers.get(changedComponent as StringKeyof<C>);
            if (observers) {
                for (const observer of observers) {
                    observer();
                }
            }
        }
        
        // Notify archetype observers
        for (const changedArchetype of result.changedArchetypes) {
            const observers = archetypeObservers.get(changedArchetype);
            if (observers) {
                for (const observer of observers) {
                    observer();
                }
            }
        }
        
        // Notify entity observers
        for (const changedEntity of result.changedEntities) {
            const observers = entityObservers.get(changedEntity);
            if (observers) {
                const values = ds.read(changedEntity);
                for (const observer of observers) {
                    observer(values);
                }
            }
        }

        return result.value;
    }

    const transactions = {} as T;

    function handleNext(
        asyncArgs: AsyncGenerator<any>,
        transaction: (db: Store<C, R>, args: any) => void,
        execute: (handler: (db: Store<C, R>) => void) => any
    ) {
        asyncArgs.next().then((result: IteratorResult<any>) => {
            const { value, done } = result;
            if (!done || value !== undefined) {
                execute((db: Store<C, R>) => transaction(db, value));
            }
            if (done) {
                return;
            }
            handleNext(asyncArgs, transaction, execute); // loop
        }).catch((error: unknown) => {
            console.error('AsyncGenerator error:', error);
        });
    }
    for (const [name, transactionUntyped] of Object.entries(transactionDeclarations)) {
        const transaction = transactionUntyped as (db: Store<C, R>, args: any) => void;
        Object.defineProperty(transactions, name, {
            value: (args: unknown) => {
                // Check if args is an AsyncArgsProvider function
                if (typeof args === 'function') {
                    const asyncArgsProvider = args as () => Promise<any> | AsyncGenerator<any>;
                    const asyncResult = asyncArgsProvider();
                    
                    if (isAsyncGenerator(asyncResult)) {
                        const asyncArgs = asyncResult;
                        handleNext(asyncArgs, transaction, execute);
                    }
                    else if (isPromise(asyncResult)) {
                        asyncResult.then(asyncArgs => execute((db) => transaction(db, asyncArgs)))
                            .catch(error => {
                                console.error('Promise error:', error);
                            });
                    }
                    else {
                        // Function returned a synchronous value
                        execute((db) => transaction(db, asyncResult));
                    }
                }
                else {
                    // Synchronous argument
                    return execute((db) => transaction(db, args));
                }
            },
            writable: false,
            enumerable: true,
            configurable: false
        });
    }

    // Return the complete observable store
    return {
        ...rest,
        resources,
        transactions,
        observe,
    } as Database<C, R, T>;
}

const addToMapSet = <K, T>(key: K, map: Map<K, Set<T>>) => (value: T) => {
    let set = map.get(key);
    if (set) {
        set.add(value);
    } else {
        map.set(key, (set = new Set([value])));
    }
    return () => {
        set!.delete(value);
    };
};
