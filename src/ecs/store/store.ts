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
import { Core, QueryOptions, ReadonlyCore } from "./core/core.js";
import { Entity } from "../entity.js";
import { StringKeyof } from "../../types/types.js";

interface BaseStore<C extends CoreComponents> {
    select<
        Include extends StringKeyof<C>,
        Exclude extends StringKeyof<C> = never
    >(
        include: Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly Entity[];
}

export interface ReadonlyStore<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never
> extends BaseStore<C>, ReadonlyCore<C> {
    readonly resources: { readonly [K in StringKeyof<R>]: R[K] };
}

export type ToReadonlyStore<T extends Store<any, any>> = T extends Store<infer C, infer R> ? ReadonlyStore<C, R> : never;

/**
 * Store is the main interface for storing components, entities and resources.
 */
export interface Store<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never
> extends BaseStore<C>, Core<C> {
    readonly resources: { -readonly [K in StringKeyof<R>]: R[K] };
}
