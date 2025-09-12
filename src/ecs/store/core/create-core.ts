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

import { FromSchema, Schema } from "../../../schema/schema.js";
import { createEntityLocationTable } from "../../entity-location-table/index.js";
import * as ARCHETYPE from "../../archetype/index.js";
import * as TABLE from "../../../table/index.js";
import { Archetype, ReadonlyArchetype } from "../../archetype/archetype.js";
import { CoreComponents } from "../../core-components.js";
import { Entity, EntitySchema } from "../../entity.js";
import { Core, EntityUpdateValues, ArchetypeQueryOptions } from "./core.js";
import { Assert, Equal, Simplify, StringKeyof } from "../../../types/index.js";
import { ComponentSchemas } from "../../component-schemas.js";

export function createCore<NC extends ComponentSchemas>(newComponentSchemas: NC): Core<Simplify<{ [K in StringKeyof<NC>]: FromSchema<NC[K]> }>> {
    type C = CoreComponents & { [K in StringKeyof<NC>]: FromSchema<NC[K]> };

    const componentSchemas: { readonly [K in StringKeyof<C>]: Schema } = { id: EntitySchema, ...newComponentSchemas };
    const entityLocationTable = createEntityLocationTable();
    const archetypes = [] as unknown as Archetype<C & CoreComponents>[] & { readonly [x: string]: Archetype<C> };

    const queryArchetypes = <
        Include extends StringKeyof<C>,
    >(
        include: readonly Include[] | ReadonlySet<string>,
        options?: ArchetypeQueryOptions<C>
    ): readonly Archetype<CoreComponents & Pick<C, Include>>[] => {
        const includeArray = Array.from(include);
        const results: Archetype<CoreComponents & Pick<C, Include>>[] = [];
        for (const archetype of archetypes) {
            const hasAllRequired = includeArray.every(comp => archetype.columns[comp] !== undefined);
            const hasNoExcluded = !options?.exclude || options.exclude.every(comp => archetype.columns[comp] === undefined);
            if (hasAllRequired && hasNoExcluded) {
                results.push(archetype as unknown as Archetype<CoreComponents & Pick<C, Include>>);
            }
        }
        return results;
    }

    const ensureArchetype = <CC extends StringKeyof<C>>(componentNames: readonly CC[]): Archetype<CoreComponents & { [K in CC]: C[K] }> => {
        for (const archetype of queryArchetypes(componentNames)) {
            if (archetype.components.size === componentNames.length) {
                return archetype as unknown as Archetype<CoreComponents & { [K in CC]: C[K] }>;
            }
        }
        const id = archetypes.length;
        const archetypeComponentSchemas: { [K in CC]: Schema } = {} as { [K in CC]: Schema };
        let hasId = false;
        for (const comp of componentNames) {
            if (comp === "id") {
                hasId = true;
            }
            archetypeComponentSchemas[comp] = componentSchemas[comp];
        }
        if (!hasId) {
            throw new Error("id is required");
        }
        const archetype = ARCHETYPE.createArchetype(archetypeComponentSchemas as any, id, entityLocationTable);
        archetypes.push(archetype as unknown as Archetype<C>);
        return archetype as unknown as Archetype<CoreComponents & { [K in CC]: C[K] }>;
    }

    const { locate } = entityLocationTable;

    const readEntity = (entity: Entity, minArchetype?: ReadonlyArchetype<C> | Archetype<C>): any => {
        const location = locate(entity);
        if (location === null) {
            return null;
        }
        const archetype = archetypes[location.archetype];
        if (minArchetype && location.archetype !== minArchetype.id && !archetype.components.isSupersetOf(minArchetype.components)) {
            return null;
        }
        return TABLE.getRowData(archetype, location.row);
    }

    const deleteEntity = (entity: Entity) => {
        const location = locate(entity);
        if (location !== null) {
            const archetype = archetypes[location.archetype];
            if (!archetype) {
                throw new Error("Archetype not found: " + JSON.stringify(location));
            }
            ARCHETYPE.deleteRow(archetype, location.row, entityLocationTable);
            entityLocationTable.delete(entity);
        }
    }

    const updateEntity = (entity: Entity, components: EntityUpdateValues<C>) => {
        const currentLocation = locate(entity);
        if (currentLocation === null) {
            throw "Entity not found";
        }
        const currentArchetype = archetypes[currentLocation.archetype];
        let newArchetype = currentArchetype;
        let addComponents: null | StringKeyof<C>[] = null;
        let removeComponents: null | StringKeyof<C>[] = null;
        for (const key in components) {
            if ((components as any)[key as any] === undefined) {
                (removeComponents ??= []).push(key as StringKeyof<C>);
                // we remove the delete components so we can use this object for the new row data
                delete (components as any)[key as any];
            }
            else if (!currentArchetype.components.has(key as StringKeyof<C>)) {
                (addComponents ??= []).push(key as StringKeyof<C>);
            }
        }
        if (addComponents || removeComponents) {
            // currently changing archetype requires a set, but later we should have an edge map for better performance
            // Alternatively we can have a faster path using addComponent and deleteComponent.
            const newComponents = new Set(currentArchetype.components);
            if (addComponents) {
                for (const comp of addComponents) {
                    newComponents.add(comp);
                }
            }
            if (removeComponents) {
                for (const comp of removeComponents) {
                    newComponents.delete(comp);
                }
            }
            newArchetype = ensureArchetype(Array.from(newComponents) as StringKeyof<C>[]) as unknown as Archetype<C>;
        }
        if (newArchetype !== currentArchetype) {
            // create a new row in the new archetype
            const currentData = TABLE.getRowData(currentArchetype, currentLocation.row);
            // deletes the row from the current archetype (this will update the entity location table for any row which may have been moved into it's position)
            ARCHETYPE.deleteRow(currentArchetype, currentLocation.row, entityLocationTable);
            const newRow = TABLE.addRow(newArchetype, { ...currentData, ...components });
            // update the entity location table for the entity so it points to the new archetype and row
            entityLocationTable.update(entity, { archetype: newArchetype.id, row: newRow });
        } else {
            TABLE.updateRow(newArchetype, currentLocation.row, components as any);
        }
    }

    const createComponents = <NC extends ComponentSchemas>(newComponentSchemas: NC) => {
        Object.assign(componentSchemas, newComponentSchemas);
        return core as Core<C & { [K in StringKeyof<NC>]: FromSchema<NC[K]> }>;
    }

    const getComponent = <K extends StringKeyof<C>>(entity: Entity, component: K): C[K] | undefined => {
        const location = locate(entity);
        if (location === null) {
            return undefined;
        }
        const archetype = archetypes[location.archetype];
        const column = archetype.columns[component];
        return column?.get(location.row)
    }

    const core: Core<C> = {
        componentSchemas: componentSchemas,
        queryArchetypes,
        ensureArchetype,
        addComponents: createComponents,
        locate: (entity) => {
            const location = locate(entity);
            if (location === null) {
                return null;
            }
            return { archetype: archetypes[location.archetype] as any, row: location.row };
        },
        get: getComponent,
        read: readEntity,
        delete: deleteEntity,
        update: updateEntity,
        toData: () => ({
            componentSchemas,
            entityLocationTableData: entityLocationTable.toData(),
            archetypesData: archetypes.map(archetype => archetype.toData())
        }),
        fromData: (data: any) => {
            Object.assign(componentSchemas, data.componentSchemas);
            entityLocationTable.fromData(data.entityLocationTableData);
            for (let i = 0; i < data.archetypesData.length; i++) {
                const componentNames = Object.keys(data.archetypesData[i].columns);
                const archetype = ensureArchetype(componentNames as any);
                archetype.fromData(data.archetypesData[i]);
            }
        }
    };
    return core as any;
}

type TestType = ReturnType<typeof createCore<{ position: { type: "number" }, health: { type: "string" } }>>
type CheckTestType = Assert<Equal<TestType, Core<{
    position: number;
    health: string;
}>>>
type TestTypeComponents = TestType["componentSchemas"]
type CheckComponents = Assert<Equal<TestTypeComponents, {
    readonly id: Schema;
    readonly position: Schema;
    readonly health: Schema;
}>>;