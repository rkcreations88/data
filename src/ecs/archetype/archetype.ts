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
import { RequiredComponents } from "../required-components.js";
import { Entity } from "../entity.js";
import { Table, ReadonlyTable } from "../../table/index.js";
import { Assert } from "../../types/assert.js";
import { Equal } from "../../types/equal.js";
import { Exact } from "../../types/types.js";

export type EntityInsertValues<C> = Omit<C, "id">;
export type ArchetypeId = number;

interface BaseArchetype {
    readonly id: ArchetypeId;
    readonly components: ReadonlySet<string>;
}
export interface ReadonlyArchetype<C extends RequiredComponents> extends BaseArchetype, ReadonlyTable<C> {
    toData: () => unknown
}

export interface Archetype<C extends RequiredComponents = RequiredComponents> extends BaseArchetype, Table<C> {
    insert: <T extends EntityInsertValues<C>>(rowData: Exact<EntityInsertValues<C>, T>) => Entity;
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

// Compile-time tests for Exact in insert method
{
    type TestArchetype = Archetype<{ id: Entity, position: [number, number, number], color: [number, number, number, number] }>;
    type TestInsertValid = { position: [number, number, number], color: [number, number, number, number] };
    type TestInsertExtra = { position: [number, number, number], color: [number, number, number, number], extra: string };

    // Valid insert should work
    const testValidInsert = (arch: TestArchetype) => {
        const validData: TestInsertValid = { position: [0, 0, 0], color: [1, 1, 1, 1] };
        arch.insert(validData); // Should compile
    };

    // Insert with extra properties should fail
    const testInvalidInsert = (arch: TestArchetype) => {
        const invalidData: TestInsertExtra = { position: [0, 0, 0], color: [1, 1, 1, 1], extra: "bad" };
        // @ts-expect-error - Should reject extra properties
        arch.insert(invalidData);
    };
}