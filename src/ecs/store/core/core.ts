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
import { RequiredComponents } from "../../required-components.js";
import { StringKeyof } from "../../../types/index.js";
import { Components } from "../components.js";

export type EntityValues<C> = { readonly [K in (RequiredComponents & StringKeyof<C>)]: C[K] }
export type EntityReadValues<C> = RequiredComponents & { readonly [K in StringKeyof<C>]?: C[K] }
export type EntityUpdateValues<C> = Partial<Omit<C, "id">>;

export type ArchetypeQueryOptions<C extends object> =
    { exclude?: readonly StringKeyof<C>[] };
export interface ReadonlyCore<
    C extends Components = never,
> {
    readonly componentSchemas: { readonly [K in StringKeyof<C & RequiredComponents>]: Schema };

    queryArchetypes<
        Include extends StringKeyof<C & RequiredComponents>,
    >(
        include: readonly Include[] | ReadonlySet<string>,
        options?: ArchetypeQueryOptions<C>
    ): readonly ReadonlyArchetype<RequiredComponents & Pick<C & RequiredComponents, Include>>[];
    ensureArchetype: <const CC extends StringKeyof<C & RequiredComponents>>(components: readonly CC[] | ReadonlySet<CC>) => ReadonlyArchetype<RequiredComponents & { [K in CC]: (C & RequiredComponents)[K] }>;

    locate: (entity: Entity) => { archetype: ReadonlyArchetype<RequiredComponents>, row: number } | null;
    read<T extends RequiredComponents>(entity: Entity, minArchetype: ReadonlyArchetype<T> | Archetype<T>): { readonly [K in (StringKeyof<RequiredComponents & T>)]: (RequiredComponents & T)[K] } & EntityReadValues<C> | null;
    read(entity: Entity): { readonly [K in (StringKeyof<RequiredComponents & C>)]: (RequiredComponents & C)[K] } | null;
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
        Include extends StringKeyof<C & RequiredComponents>,
    >(
        include: readonly Include[] | ReadonlySet<string>,
        options?: ArchetypeQueryOptions<C>
    ): readonly Archetype<RequiredComponents & Pick<C & RequiredComponents, Include>>[];
    ensureArchetype: <const CC extends StringKeyof<C & RequiredComponents>>(components: readonly CC[] | ReadonlySet<CC>) => Archetype<RequiredComponents & { [K in CC]: (C & RequiredComponents)[K] }>;
    locate: (entity: Entity) => { archetype: Archetype<RequiredComponents>, row: number } | null;
    delete: (entity: Entity) => void;
    update: (entity: Entity, values: EntityUpdateValues<C>) => void;
    compact: () => void;
    fromData(data: unknown): void
}
