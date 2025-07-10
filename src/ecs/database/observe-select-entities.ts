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
            let isMicrotaskQueued = false;

            const notifyObsever = () => {
                // we just do a full select here.
                // later we will optimize this, since this algorithm is O(n)
                observer(store.select(include, options));
                isMicrotaskQueued = false;
            }

            const unobserveTransactions = observeTransactions(t => {
                if (t.changedComponents.isDisjointFrom(includeSet)) {
                    // no components in the changed set are in the include set
                    // so we don't need to notify the observer
                    return;
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