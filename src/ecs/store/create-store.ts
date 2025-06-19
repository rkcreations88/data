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
import { ResourceComponents } from "./resource-components.js";
import { ComponentSchemas } from "../component-schemas.js";
import { StringKeyof } from "../../types/types.js";
import { CoreComponents } from "../core-components.js";
import { Simplify } from "../../types/index.js";
import { Store } from "./store.js";
import { FromSchema, Schema } from "../../schema/schema.js";
import { createCore } from "./core/create-core.js";
import { Entity } from "../entity.js";
import { Core, QueryOptions } from "./core/core.js";

export function createStore<NC extends ComponentSchemas, R extends ResourceComponents>(
    newComponentSchemas: NC,
    resourceDefaults: R,
): Store<Simplify<CoreComponents & { [K in StringKeyof<NC>]: FromSchema<NC[K]> }>, { -readonly [K in StringKeyof<R>]: R[K] }> {
    type C = CoreComponents & { [K in StringKeyof<NC>]: FromSchema<NC[K]> };
    const resources = {} as R;
    type S = StringKeyof<C>;

    const resourceSchema = {} as const satisfies Schema;
    const componentAndResourceSchemas: { [K in StringKeyof<C | R>]: Schema } = { ...newComponentSchemas };
    // Resources are stored in the core as components, so we need to add them to the componentSchemas
    for (const name of Object.keys(resourceDefaults)) {
        const resourceId = name as StringKeyof<C | R>;
        componentAndResourceSchemas[resourceId] = resourceSchema;
    }

    const core = createCore(componentAndResourceSchemas) as unknown as Core<C>;

    // Each resource will be stored as the only entity in an archetype of [id, <resourceName>]
    // The resource component we added above will contain the resource value
    for (const [name, resource] of Object.entries(resourceDefaults)) {
        const resourceId = name as StringKeyof<C>;
        const archetype = core.ensureArchetype(["id", resourceId]);
        archetype.insert({ [resourceId]: resource } as any);
        const row = 0;
        Object.defineProperty(resources, name, {
            get: () => archetype.columns[resourceId]!.get(row),
            set: (value) => {
                archetype.columns[resourceId]!.set(row, value);
            },
            enumerable: true,
        });
    }

    const select = <
        Include extends StringKeyof<C>,
        Exclude extends StringKeyof<C> = never
    >(
        include: Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly Entity[] => {
        const archetypes = core.queryArchetypes(include, options);
        let length = 0;
        for (const archetype of archetypes) {
            length += archetype.rows;
        }
        const entities = new Array<Entity>(length);
        let index = 0;
        for (const archetype of archetypes) {
            const typedArray = archetype.columns.id.getTypedArray();
            for (let i = 0; i < archetype.rows; i++) {
                entities[index++] = typedArray[i];
            }
        }
        return entities;
    }

    const store: Store<C, R> = {
        ...core,
        resources,
        select,
    };
    
    return store as any;
}
