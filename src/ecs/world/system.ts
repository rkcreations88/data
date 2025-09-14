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
import { StringKeyof } from "../../types/types.js";
import { Database, Store, TransactionFunctions } from "../index.js";
import { ArchetypeComponents } from "../store/archetype-components.js";
import { Components } from "../store/components.js";
import { ResourceComponents } from "../store/resource-components.js";
import { SystemNames } from "./world.js";

export type StoreSystem<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>,
> = {
    type: "store";
    run: ((store: Store<C, R, A>) => void) | ((store: Store<C, R, A>) => Promise<void>);
}

export type DatabaseSystem<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>,
    T extends TransactionFunctions,
> = {
    type: "database"
    run: ((database: Database<C, R, A, T>) => void) | ((database: Database<C, R, A, T>) => Promise<void>);
}

export type System<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C>>,
    T extends TransactionFunctions,
    S extends SystemNames
> = (StoreSystem<C, R, A> | DatabaseSystem<C, R, A, T>) & {
    schedule?: {
        before?: readonly S[];
        after?: readonly S[];
    }
};
