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
import { Archetype, ArchetypeId, ReadonlyArchetype } from "../archetype/index.js";
import { ResourceComponents } from "../store/resource-components.js";
import { Store } from "../store/index.js";
import { Database, ToTransactionFunctions, TransactionDeclaration } from "./database.js";
import { Entity } from "../entity.js";
import { EntityReadValues, EntityUpdateValues } from "../store/core/index.js";
import { TransactionResult } from "./transactional-store/index.js";
import { mapEntries } from "../../internal/object/index.js";
import { StringKeyof } from "../../types/types.js";
import { Observe, withMap } from "../../observe/index.js";
import { createTransactionalStore } from "./transactional-store/create-transactional-store.js";
import { isPromise } from "../../internal/promise/is-promise.js";
import { isAsyncGenerator } from "../../internal/async-generator/is-async-generator.js";
import { Components } from "../store/components.js";
import { ArchetypeComponents } from "../store/archetype-components.js";
import { observeSelectEntities } from "./observe-select-entities.js";
import { CoreComponents } from "../core-components.js";

export function createDatabase<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>,
    TD extends Record<string, TransactionDeclaration<C, R, A>>
>(
    store: Store<C, R, A>,
    transactionDeclarations: TD,
): Database<C, R, A, ToTransactionFunctions<TD>> {
    type T = ToTransactionFunctions<TD>;

    const transactionalStore = createTransactionalStore(store);

    //  variables to track the observers
    const componentObservers = new Map<StringKeyof<C>, Set<() => void>>();
    const archetypeObservers = new Map<ArchetypeId, Set<() => void>>();
    const entityObservers = new Map<Entity, Set<(values: EntityReadValues<C> | null) => void>>();
    const transactionObservers = new Set<(transaction: TransactionResult<C>) => void>();

    //  observation interface
    const observeEntity = <T extends CoreComponents>(entity: Entity, minArchetype?: ReadonlyArchetype<T> | Archetype<T>) => (observer: (values: EntityReadValues<C> | null) => void) => {
        if (minArchetype) {
            const originalObserver = observer;
            observer = (values) => {
                if (values) {
                    const { archetype } = store.locate(entity)!;
                    if (archetype.id !== minArchetype.id && !archetype.components.isSupersetOf(minArchetype.components)) {
                        // when a min archetype is provided the entity will be considered null
                        // if the entity does not satisfy the min archetype components.
                        values = null;
                    }
                }
                originalObserver(values);
            }
        }
        // Call immediately with current values
        observer(store.read(entity));
        // Add to observers for future changes
        const dispose = addToMapSet(entity, entityObservers)(observer);
        return dispose;
    };
    const observeArchetype = (archetype: ArchetypeId) => addToMapSet(archetype, archetypeObservers);
    const observeComponent = mapEntries(store.componentSchemas, ([component]) => addToMapSet(component, componentObservers));

    // Resource observation - resources are stored as entities with specific archetypes
    const observeResource = Object.fromEntries(
        Object.entries(store.resources).map(([resource]) => {
            const archetype = store.ensureArchetype(["id" as StringKeyof<C>, resource as unknown as StringKeyof<C>]);
            const resourceId = archetype.columns.id.get(0);
            return [resource, withMap(observeEntity(resourceId), (values) => values?.[resource as unknown as StringKeyof<C>]!)];
        })
    ) as { [K in StringKeyof<R>]: Observe<R[K]>; };

    const observeTransaction: Observe<TransactionResult<C>> = (notify: (transaction: TransactionResult<C>) => void) => {
        transactionObservers.add(notify);
        return () => {
            transactionObservers.delete(notify);
        }
    }

    const observe: Database<C, R>["observe"] = {
        components: observeComponent,
        resources: observeResource,
        transactions: observeTransaction,
        entity: observeEntity,
        archetype: observeArchetype,
        select: observeSelectEntities(transactionalStore, observeTransaction),
    };

    const { execute: transactionDatabaseExecute, resources, ...rest } = transactionalStore;

    const notifyObservers = (result: TransactionResult<C>) => {
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
        for (const changedEntity of result.changedEntities.keys()) {
            const observers = entityObservers.get(changedEntity);
            if (observers) {
                const values = store.read(changedEntity);
                for (const observer of observers) {
                    observer(values);
                }
            }
        }
    }

    const execute = (handler: (db: Store<C, R, A>) => void, options?: { transient?: boolean }) => {
        const result = transactionDatabaseExecute(handler, options);
        notifyObservers(result);
        return result.value;
    }

    const transactions = {} as T;

    for (const [name, transactionUntyped] of Object.entries(transactionDeclarations)) {
        const transaction = transactionUntyped as (store: Store<C, R, A>, args: any) => void;
        Object.defineProperty(transactions, name, {
            value: (args: unknown) => {
                // Check if args is an AsyncArgsProvider function
                if (typeof args === 'function') {
                    const asyncArgsProvider = args as () => Promise<any> | AsyncGenerator<any>;
                    const asyncResult = asyncArgsProvider();

                    if (isAsyncGenerator(asyncResult)) {
                        (async () => {
                            try {
                                let lastArgs: any = undefined;
                                for await (const asyncArgs of asyncResult) {
                                    lastArgs = asyncArgs;
                                    execute(t => transaction(t, asyncArgs), { transient: true });
                                }
                                if (lastArgs) {
                                    execute(t => transaction(t, lastArgs), { transient: false });
                                }
                                return lastArgs;
                            }
                            catch (error) {
                                console.error('AsyncGenerator error:', error);
                            }
                        })();
                    }
                    else if (isPromise(asyncResult)) {
                        asyncResult.then(asyncArgs => execute(t => transaction(t, asyncArgs)))
                            .catch(error => {
                                console.error('Promise error:', error);
                            });
                    }
                    else {
                        // Function returned a synchronous value
                        execute(t => transaction(t, asyncResult));
                    }
                }
                else {
                    // Synchronous argument
                    return execute(t => transaction(t, args));
                }
            },
            writable: false,
            enumerable: true,
            configurable: false
        });
    }

    const notifyAllObserversStoreReloaded = () => {
        const notifyResult: TransactionResult<C> = {
            changedComponents: new Set(componentObservers.keys()),
            changedArchetypes: new Set(archetypeObservers.keys()),
            changedEntities: new Map([...entityObservers.keys()].map((entity) => {
                let values = store.read(entity);
                let updateValues: EntityUpdateValues<C> | null = null;
                if (values) {
                    const { id, ...rest } = values;
                    updateValues = rest as EntityUpdateValues<C>;
                }
                return [
                    entity,
                    updateValues
                ]
            })),
            transient: false,
            value: undefined,
            undo: [],
            redo: [],
            undoable: null,
        }
        notifyObservers(notifyResult);
    }

    // Return the complete observable store
    const database = {
        ...rest,
        resources,
        transactions,
        observe,
        toData: () => store.toData(),
        fromData: (data: unknown) => {
            store.fromData(data);
            notifyAllObserversStoreReloaded();
        }
    } as Database<C, R, A, T>;
    return database;
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
