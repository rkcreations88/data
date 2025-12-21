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

import { FromSchemas } from "../../../schema/index.js";
import { StringKeyof } from "../../../types/types.js";
import { ArchetypeComponents, ComponentSchemas, Database, ResourceSchemas } from "../../index.js";
import { ActionDeclarations, ToActionFunctions } from "../../store/action-functions.js";
import { SystemDeclaration } from "../system-declaration.js";

export * as WorldSchema from "./public/index.js";

export type SystemDeclarations<S extends string> = { readonly [K in S]: SystemDeclaration<K> };
export type SystemFunctions<S extends string> = { readonly [K in S]: () => void };

export interface WorldSchema<
    C extends ComponentSchemas = never,
    R extends ResourceSchemas = never,
    A extends ArchetypeComponents<StringKeyof<C>> = never,
    T extends ActionDeclarations<FromSchemas<C>, FromSchemas<R>, A> = never,
    S extends string = never,
> {
    schema: Database.Schema<C, R, A, T>;
    systems: SystemDeclarations<S>;
    create(db: Database<FromSchemas<C>, FromSchemas<R>, A, ToActionFunctions<T>>): SystemFunctions<S>;
}
