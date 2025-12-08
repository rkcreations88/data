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

import { ComponentSchemas } from "../component-schemas.js";
import { StringKeyof } from "../../types/types.js";
import { RequiredComponents } from "../required-components.js";
import { Store } from "./store.js";
import { FromSchema, FromSchemas, Schema } from "../../schema/index.js";
import { createCore } from "./core/create-core.js";
import { Entity } from "../entity.js";
import { Core } from "./core/core.js";
import { ResourceSchemas } from "../resource-schemas.js";
import { ArchetypeComponents } from "./archetype-components.js";
import { EntitySelectOptions } from "./entity-select-options.js";
import { selectEntities } from "./core/select-entities.js";
import { OptionalComponents } from "../optional-components.js";

export function createStore<
    NC extends ComponentSchemas,
    NR extends ResourceSchemas,
    A extends ArchetypeComponents<StringKeyof<NC & OptionalComponents>> = {}
>(
    newComponentSchemas: NC,
    resourceSchemas: NR = {} as NR,
    archetypeComponentNames: A = {} as A,
): Store<FromSchemas<NC>, FromSchemas<NR>, A> {
    type C = RequiredComponents & { [K in StringKeyof<NC>]: FromSchema<NC[K]> };
    type R = { [K in StringKeyof<NR>]: FromSchema<NR[K]> };

    const resources = {} as R;

    const componentAndResourceSchemas: { [K in StringKeyof<C | R>]: Schema } = {
        ...newComponentSchemas,
    };
    // Resources are stored in the core as components, so we need to add them to the componentSchemas
    for (const name of Object.keys(resourceSchemas)) {
        const resourceId = name as StringKeyof<C | R>;
        componentAndResourceSchemas[resourceId] = resourceSchemas[name];
    }

    const core = createCore(componentAndResourceSchemas) as unknown as Core<C>;

    // Each resource will be stored as the only entity in an archetype of [id, <resourceName>]
    // The resource component we added above will contain the resource value
    const ensureDefaultResourcesAndPropertiesExist = () => {
        for (const [name, resourceSchema] of Object.entries(resourceSchemas)) {
            const resourceId = name as StringKeyof<C>;
            const archetype = core.ensureArchetype(["id", resourceId]);
            if (archetype.rowCount === 0) {
                archetype.insert({ [resourceId]: resourceSchema.default } as any);
            }
            const row = 0;
            Object.defineProperty(resources, name, {
                get: () => archetype.columns[resourceId]!.get(row),
                set: (value) => {
                    archetype.columns[resourceId]!.set(row, value);
                },
                enumerable: true,
                configurable: true,
            });
        }
    }
    ensureDefaultResourcesAndPropertiesExist();

    const select = <
        Include extends StringKeyof<C & OptionalComponents>
    >(
        include: readonly Include[] | ReadonlySet<string>,
    options?: EntitySelectOptions<C & OptionalComponents, Pick<C & RequiredComponents & OptionalComponents, Include>>
    ): readonly Entity[] => {
        return selectEntities<C, Include>(core, include, options);
    }

    const archetypes = Object.fromEntries(
        Object.entries(archetypeComponentNames).map(([name, componentNames]) => {
            const archetype = core.ensureArchetype(["id", ...componentNames as any]);
            return [name, archetype] as const;
        })
    ) as any;

    const store: Store<C, R> = {
        ...core,
        resources,
        select,
        archetypes,
        toData: () => core.toData(),
        fromData: (data: unknown) => {
            core.fromData(data);
            ensureDefaultResourcesAndPropertiesExist();
        }
    };

    return store as any;
}
