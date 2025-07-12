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
import { CoreComponents } from "../core-components.js";
import { ResourceComponents } from "./resource-components.js";
import { Core, ReadonlyCore } from "./core/core.js";
import { Entity } from "../entity.js";
import { StringKeyof } from "../../types/types.js";
import { Components } from "./components.js";
import { ArchetypeComponents } from "./archetype-components.js";
import { Archetype, ReadonlyArchetype } from "../archetype/archetype.js";
import { EntitySelectOptions } from "./entity-select-options.js";

interface BaseStore<C extends object = never> {
    select<
        Include extends StringKeyof<C>,
        T extends Include
    >(
        include: readonly Include[] | ReadonlySet<string>,
        options?: EntitySelectOptions<C, Pick<C & CoreComponents, T>>
    ): readonly Entity[];
}

export interface ReadonlyStore<
    C extends Components = never,
    R extends ResourceComponents = never,
    A extends ArchetypeComponents<StringKeyof<C>> = never,
> extends BaseStore<C>, ReadonlyCore<C> {
    readonly resources: { readonly [K in StringKeyof<R>]: R[K] };
    readonly archetypes: { -readonly [K in StringKeyof<A>]: ReadonlyArchetype<CoreComponents & { [P in A[K][number]]: C[P] }> }
}

export type ToReadonlyStore<T extends Store<any, any>> = T extends Store<infer C, infer R> ? ReadonlyStore<C, R> : never;

/**
 * Store is the main interface for storing components, entities and resources.
 */
export interface Store<
    C extends Components = never,
    R extends ResourceComponents = never,
    A extends ArchetypeComponents<StringKeyof<C>> = never,
> extends BaseStore<C>, Core<C> {
    readonly resources: { -readonly [K in StringKeyof<R>]: R[K] };
    readonly archetypes: { -readonly [K in StringKeyof<A>]: Archetype<CoreComponents & { [P in A[K][number]]: C[P] }> }
}

