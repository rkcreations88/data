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
import { Entity } from "../entity.js";
import { Table, ReadonlyTable } from "../../table/index.js";
import { Assert } from "../../types/assert.js";
import { Equal } from "../../types/equal.js";

export type EntityInsertValues<C> = Omit<C, "id">;
export type ArchetypeId = number;

interface BaseArchetype {
    readonly id: ArchetypeId;
    readonly components: ReadonlySet<string>;
}
export interface ReadonlyArchetype<C extends CoreComponents> extends BaseArchetype, ReadonlyTable<C> {
    toData: () => unknown
}

export interface Archetype<C extends CoreComponents = CoreComponents> extends BaseArchetype, Table<C> {
    insert: (rowData: EntityInsertValues<C>) => Entity;
    toData: () => unknown
    fromData: (data: unknown) => void
}

export type FromArchetype<T> =
    T extends ReadonlyArchetype<infer C> ? { readonly [K in keyof C]: C[K] } :
    T extends Archetype<infer C> ? { readonly [K in keyof C]: C[K] } :
    never;

// compile time type tests.
type TestFromReadonlyArchetype = Assert<Equal<FromArchetype<ReadonlyArchetype<{ id: number, a: number, b: string }>>, { readonly id: number, readonly a: number, readonly b: string }>>;
type TestFromArchetype = Assert<Equal<FromArchetype<Archetype<{ id: number, a: number, b: string }>>, { readonly id: number, readonly a: number, readonly b: string }>>;