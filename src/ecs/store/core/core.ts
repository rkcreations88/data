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
import { CoreComponents } from "../../core-components.js";
import { StringKeyof } from "../../../types/index.js";
import { Components } from "../components.js";
import { ComponentSchemas } from "../../component-schemas.js";
import { FromSchema } from "../../../schema/schema.js";

export type EntityValues<C> = { readonly [K in (CoreComponents & StringKeyof<C>)]: C[K] }
export type EntityReadValues<C> = CoreComponents & { readonly [K in StringKeyof<C>]?: C[K] }
export type EntityUpdateValues<C> = Partial<Omit<C, "id">>;

export type ArchetypeQueryOptions<C extends object> =
    { exclude?: readonly StringKeyof<C>[] };

export interface ReadonlyCore<
    C extends Components = never,
> {
    readonly componentSchemas: { readonly [K in StringKeyof<C & CoreComponents>]: Schema };

    queryArchetypes<
        Include extends StringKeyof<C & CoreComponents>,
    >(
        include: readonly Include[] | ReadonlySet<string>,
        options?: ArchetypeQueryOptions<C>
    ): readonly ReadonlyArchetype<CoreComponents & Pick<C & CoreComponents, Include>>[];
    ensureArchetype: <const CC extends StringKeyof<C & CoreComponents>>(components: readonly CC[]) => ReadonlyArchetype<CoreComponents & { [K in CC]: (C & CoreComponents)[K] }>;

    locate: (entity: Entity) => { archetype: ReadonlyArchetype<CoreComponents>, row: number } | null;
    read<T extends CoreComponents>(entity: Entity, minArchetype: ReadonlyArchetype<T> | Archetype<T>): { readonly [K in (StringKeyof<CoreComponents & T>)]: (CoreComponents & T)[K] } & EntityReadValues<C> | null;
    read(entity: Entity): { readonly [K in (StringKeyof<CoreComponents & C>)]: (CoreComponents & C)[K] } | null;
    get<K extends StringKeyof<C>>(entity: Entity, component: K): C[K] | undefined;
    toData(): unknown
}

/**
 * This is the main interface for the low level ECS Core.
 */
export interface Core<
    C extends Components = never,
> extends ReadonlyCore<C> {
    queryArchetypes<
        Include extends StringKeyof<C & CoreComponents>,
    >(
        include: readonly Include[] | ReadonlySet<string>,
        options?: ArchetypeQueryOptions<C>
    ): readonly Archetype<CoreComponents & Pick<C & CoreComponents, Include>>[];
    ensureArchetype: <const CC extends StringKeyof<C & CoreComponents>>(components: readonly CC[]) => Archetype<CoreComponents & { [K in CC]: (C & CoreComponents)[K] }>;
    locate: (entity: Entity) => { archetype: Archetype<CoreComponents>, row: number } | null;
    delete: (entity: Entity) => void;
    update: (entity: Entity, values: EntityUpdateValues<C>) => void;
    compact: () => void;
    fromData(data: unknown): void
}
