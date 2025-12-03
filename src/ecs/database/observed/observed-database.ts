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

import { Archetype, ArchetypeId, ReadonlyArchetype } from "../../archetype/index.js";
import { Components } from "../../store/components.js";
import { ResourceComponents } from "../../store/resource-components.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";
import { StringKeyof } from "../../../types/types.js";
import { ReadonlyStore, Store } from "../../store/index.js";
import { Observe } from "../../../observe/index.js";
import { TransactionResult } from "../transactional-store/index.js";
import { RequiredComponents } from "../../required-components.js";
import { Entity } from "../../entity.js";
import { EntityReadValues } from "../../store/core/index.js";
import { OptionalComponents } from "../../optional-components.js";
export interface ObservedDatabase<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>
> extends ReadonlyStore<C, R, A> {
    readonly resources: { readonly [K in StringKeyof<R>]: R[K] };
    readonly observe: {
        readonly components: { readonly [K in StringKeyof<C>]: Observe<void> };
        readonly resources: { readonly [K in StringKeyof<R>]: Observe<R[K]> };
        readonly transactions: Observe<TransactionResult<C>>;
        entity<T extends RequiredComponents>(id: Entity, minArchetype?: ReadonlyArchetype<T> | Archetype<T>): Observe<{ readonly [K in (StringKeyof<RequiredComponents & T>)]: (RequiredComponents & T)[K] } & EntityReadValues<C> | null>;
        entity(id: Entity): Observe<EntityReadValues<C> | null>;
        archetype(id: ArchetypeId): Observe<void>;
        select<
            Include extends StringKeyof<C>,
            T extends Include
        >(
            include: readonly Include[] | ReadonlySet<string>,
            options?: any
        ): Observe<readonly Entity[]>;
    };
    readonly execute: (handler: (db: Store<C, R, A>) => Entity | void, options?: { transient?: boolean }) => TransactionResult<C>;
    readonly toData: () => unknown;
    readonly fromData: (data: unknown) => void;
}


