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

import { selectRows } from "../../../table/select-rows.js";
import { StringKeyof } from "../../../types/types.js";
import { CoreComponents } from "../../core-components.js";
import { Entity } from "../../entity.js";
import { EntitySelectOptions } from "../entity-select-options.js";
import { Core } from "./core.js";

export const selectEntities = <
    C extends object,
    Include extends StringKeyof<C>
>(
    core: Core<C>,
    include: Include[],
    options?: EntitySelectOptions<C & CoreComponents, Pick<C & CoreComponents, Include>>
): readonly Entity[] => {
    const archetypes = core.queryArchetypes(include, options as any);
    let length = 0;
    for (const archetype of archetypes) {
        length += archetype.rows;
    }
    if (!options?.where && !options?.order) {
        // when there is no where filter or order we have a fast path
        // that just uses the id column as a typed array.
        const entities = new Array<Entity>(length);
        let index = 0;
        for (const archetype of archetypes) {
            const idTypedArray = archetype.columns.id.getTypedArray();
            for (let i = 0; i < archetype.rows; i++) {
                entities[index++] = idTypedArray[i];
            }
        }
        return entities;
    }
    if (options?.where && !options.order) {
        const entities = new Array<Entity>();
        for (const archetype of archetypes) {
            const idTypedArray = archetype.columns.id.getTypedArray();
            for (let row of selectRows<Pick<C & CoreComponents, Include>>(archetype as any, options.where)) {
                entities.push(idTypedArray[row]);
            }
        }
        return entities;
    }

    // now we know there is an order, there might be a where
    // ordering means we are going to want to extract the order values into an array that also contains id
    const entityValues = new Array<CoreComponents & { [K in Include]: any }>();
    for (const archetype of archetypes) {
        const idTypedArray = archetype.columns.id.getTypedArray();
        for (let row of selectRows<Pick<C & CoreComponents, Include>>(archetype as any, options.where)) {
            const entityValue = { id: idTypedArray[row] } as any;
            for (const order in options.order!) {
                entityValue[order] = archetype.columns[order]!.get(row);
            }
            entityValues.push(entityValue);
        }
    }
    // now that we have the entity values with the order values, we can sort the entity values
    entityValues.sort((a, b) => {
        for (const order in options.order!) {
            if (a[order] !== b[order]) {
                const comparison = a[order] - b[order];
                const ascending = options.order[order];
                return ascending ? comparison : -comparison;
            }
        }
        return 0;
    });
    return entityValues.map(entityValue => entityValue.id);
}