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

import { FromSchema } from "../../schema/schema.js";
import * as TABLE from "../../table/index.js";
import { Archetype } from "./archetype.js";
import { CoreComponents } from "../core-components.js";
import { EntityLocationTable } from "../entity-location-table/entity-location-table.js";
import { Entity, schema } from "../entity.js";
import { StringKeyof } from "../../types/types.js";

export const createArchetype = <C extends { id: typeof schema }>(
    components: C,
    id: number,
    entityLocationTable: EntityLocationTable,
): Archetype<CoreComponents & { [K in keyof C]: FromSchema<C[K]> }> => {
    const table = TABLE.createTable(components);
    const createEntity = (rowData: Omit<{ [K in keyof C]: FromSchema<C[K]> }, "id">): Entity => {
        // add the row (excluding entity id)
        const row = TABLE.addRow(archetype as any, rowData);
        // create the entity lookup record
        const entity = entityLocationTable.create({ archetype: archetype.id, row });
        // set the entity id for the row (since it wasn't present in the row data)
        archetype.columns.id.set(row, entity as any);
        return entity;
    }

    const componentSet = new Set(Object.keys(components) as StringKeyof<C & CoreComponents>[]);

    const archetype = {
        id,
        ...table,
        components: componentSet,
        insert: createEntity,
        toData: () => ({
            columns: archetype.columns,
            rowCount: archetype.rowCount,
            rowCapacity: archetype.rowCapacity,
        }),
        fromData: (data: unknown) => {
            Object.assign(archetype, data);
            // component set cannot be changed by this as the archetype components should be the same.
        }
    } as const satisfies Archetype<{ [K in keyof C]: FromSchema<C[K]> }> as Archetype<CoreComponents & { [K in keyof C]: FromSchema<C[K]> }>;
    return archetype;
}