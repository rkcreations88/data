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

import { Observe, withCache } from "../../observe/index.js";
import { getRowPredicateFromFilter } from "../../table/select-rows.js";
import { StringKeyof } from "../../types/types.js";
import { CoreComponents } from "../core-components.js";
import { Entity } from "../entity.js";
import { ReadonlyStore } from "../index.js";
import { EntitySelectOptions } from "../store/entity-select-options.js";
import { TransactionResult } from "./transactional-store/transactional-store.js";

export const observeSelectEntities = <C extends object>(store: ReadonlyStore<C, any, any>, observeTransactions: Observe<TransactionResult<C>>) => {
    const cachedSelectObserveFunctions = new Map<string, Observe<readonly Entity[]>>();

    const createSelectObserveFunction = <Include extends StringKeyof<C>>(
        include: Include[],
        options?: EntitySelectOptions<C, Pick<C & CoreComponents, Include>>
    ): Observe<readonly Entity[]> => {
        return (observer: (entities: readonly Entity[]) => void) => {
            const includeSet = new Set(include);
            const whereSet = new Set(Object.keys(options?.where ?? {}) as StringKeyof<C>[]);
            const orderSet = new Set(Object.keys(options?.order ?? {}) as StringKeyof<C>[]);
            let isMicrotaskQueued = false;
            let currentEntities: Set<Entity> | null = null;
            const rowPredicate = getRowPredicateFromFilter(options?.where);

            const notifyObsever = () => {
                // we just do a full select here.
                // later we will optimize this, since this algorithm is O(n)
                const entities = store.select(include, options);
                currentEntities = new Set(entities);
                observer(entities);
                isMicrotaskQueued = false;
            }

            const unobserveTransactions = observeTransactions(t => {
                if (t.changedComponents.isDisjointFrom(includeSet)) {
                    // no components in the changed set are in the include set
                    // so we don't need to notify the observer. there is no possible change.
                    return;
                }

                if (currentEntities) {
                    let needsUpdate = false;
                    for (const entity of t.changedEntities.keys()) {
                        if (currentEntities.has(entity)) {
                            const changedEntityValues = t.changedEntities.get(entity);
                            if (!changedEntityValues) {
                                // entity delete => update
                                needsUpdate = true;
                                break;
                            }
                            const changedComponentSet = new Set(Object.keys(changedEntityValues) as StringKeyof<C>[]);
                            if (!changedComponentSet.isDisjointFrom(orderSet)) {
                                // entity order components changed => update
                                needsUpdate = true;
                                break;
                            }
                            if (!changedComponentSet.isDisjointFrom(whereSet)) {
                                // some where components were changed, 
                                // we will see if the entity is still in the result set
                                const { archetype, row } = store.locate(entity)!;
                                if (!rowPredicate(archetype as any, row)) {
                                    // entity is no longer in the result set
                                    needsUpdate = true;
                                    break;
                                }
                            }
                        }
                        else {
                            // this entity is not in the set, we need to check it would be added to the result set.
                            const location = store.locate(entity);
                            if (location) {
                                const { archetype, row } = location;
                                if (archetype.components.isSupersetOf(includeSet)) {
                                    if (rowPredicate(archetype as any, row)) {
                                        // this entity would be in the result set.
                                        needsUpdate = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (!needsUpdate) {
                        // early exit, we don't need to requery
                        // because we are certain the entities and order could not have changed.
                        return;
                    }
                }

                if (!isMicrotaskQueued) {
                    isMicrotaskQueued = true;
                    queueMicrotask(notifyObsever);
                }
            });

            notifyObsever();

            return () => {
                unobserveTransactions();
            }
        }
    }

    return <Include extends StringKeyof<C>>(
        include: Include[],
        options?: EntitySelectOptions<C, Pick<C & CoreComponents, Include>>
    ) => {
        const key = JSON.stringify({ include, options });
        let observeFunction = cachedSelectObserveFunctions.get(key);
        if (!observeFunction) {
            observeFunction = withCache(createSelectObserveFunction(include, options));
            cachedSelectObserveFunctions.set(key, observeFunction);
        }
        return observeFunction;
    }
}