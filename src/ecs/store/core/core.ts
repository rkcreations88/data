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

import { Entity } from "../../entity.js";
import { Archetype, ReadonlyArchetype } from "../../archetype/archetype.js";
import { Schema } from "../../../schema/schema.js";
import { EntityLocation } from "../../entity-location-table/entity-location.js";
import { CoreComponents } from "../../core-components.js";
import { StringKeyof } from "../../../types/index.js";
import { Components } from "../components.js";

export type EntityValues<C> = CoreComponents & { readonly [K in StringKeyof<C>]?: C[K] }
export type EntityUpdateValues<C> = Partial<Omit<C, "id">>;

export type QueryOptions<Include, Exclude> =
    Extract<Include, Exclude> extends never
        ? { exclude?: readonly Exclude[] }
        : { exclude?: never };

export interface ReadonlyCore<
    C extends Components = never,
> {
    readonly componentSchemas: { readonly [K in StringKeyof<C>]: Schema };

    queryArchetypes<
        Include extends StringKeyof<C & CoreComponents>,
        Exclude extends StringKeyof<C> = never
    >(
        include: readonly Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly ReadonlyArchetype<CoreComponents & Pick<C & CoreComponents, Include>>[];

    ensureArchetype: <const CC extends StringKeyof<C | CoreComponents>>(components: readonly CC[]) => ReadonlyArchetype<CoreComponents & { [K in CC]: (C & CoreComponents)[K]}>;
    locate: (entity: Entity) => EntityLocation | null;
    read: (entity: Entity) => EntityValues<C> | null;
}

/**
 * This is the main interface for the low level ECS Core.
 */
export interface Core<
    C extends Components = never,
> extends ReadonlyCore<C> {
    queryArchetypes<
        Include extends StringKeyof<C & CoreComponents>,
        Exclude extends StringKeyof<C> = never
    >(
        include: readonly Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly Archetype<CoreComponents & Pick<C & CoreComponents, Include>>[];
    ensureArchetype: <const CC extends StringKeyof<C & CoreComponents>>(components: readonly CC[]) => Archetype<CoreComponents & { [K in CC]: (C & CoreComponents)[K]}>;
    delete: (entity: Entity) => void;
    update: (entity: Entity, values: EntityUpdateValues<C>) => void;
}