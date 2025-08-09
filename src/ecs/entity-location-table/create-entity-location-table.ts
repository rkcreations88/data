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
import { grow } from "../../internal/array-buffer-like/grow.js";
import { EntityLocationTable } from "./entity-location-table.js";
import { EntityLocation } from "./entity-location.js";
import { Entity } from "../entity.js";
import { createSharedArrayBuffer } from "../../internal/shared-array-buffer/create-shared-array-buffer.js";

export const createEntityLocationTable = (initialCapacity: number = 16): EntityLocationTable => {
    let freeListHead = -1;
    let nextIndex = 0;
    let capacity = initialCapacity;
    let entities = new Int32Array(createSharedArrayBuffer(capacity * 2 * 4));

    const createEntity = ({ archetype, row }: EntityLocation): Entity => {
        let entity: number;
        if (freeListHead >= 0) {
            entity = freeListHead;
            const index = freeListHead << 1;
            freeListHead = entities[index + 1];
        }
        else {
            entity = nextIndex++;
            if (nextIndex >= capacity) {
                capacity *= 2;
                entities = new Int32Array(grow(entities.buffer, capacity * 2 * 4));
            }
        }

        const index = entity << 1;
        entities[index + 0] = archetype;
        entities[index + 1] = row;

        return entity;
    }

    const deleteEntity = (entity: Entity) => {
        const index = entity << 1;
        entities[index + 0] = -1;
        entities[index + 1] = freeListHead;
        freeListHead = entity;
    }

    const locateEntity = (entity: Entity): EntityLocation | null => {
        if (entity < 0 || entity >= nextIndex) {
            return null;
        }
        const index = entity << 1;
        const archetype = entities[index + 0];
        if (archetype < 0) {
            return null;
        }
        const row = entities[index + 1];
        return { archetype, row };
    }

    const updateEntity = (entity: Entity, location: EntityLocation) => {
        const index = entity << 1;
        entities[index + 0] = location.archetype;
        entities[index + 1] = location.row;
    }

    return {
        create: createEntity,
        delete: deleteEntity,
        locate: locateEntity,
        update: updateEntity,
        toData: () => ({
            entities,
            freeListHead,
            nextIndex,
            capacity,
        }),
        fromData: (data: any) => {
            entities = data.entities;
            freeListHead = data.freeListHead;
            nextIndex = data.nextIndex;
            capacity = data.capacity;
        }
    };
}
