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
import { copyViewBytes } from "../../functions/copy-view-bytes.js";

export const createEntityLocationTable = (initialCapacity: number = 16): EntityLocationTable => {
    return restoreEntityLocationTable({
        freeListHead: -1,
        nextIndex: 0,
        capacity: initialCapacity,
    });
}

type SerializedProps = {
    freeListHead: number;
    nextIndex: number;
    capacity: number;
}

export const restoreEntityLocationTable = (props: SerializedProps, entityData?: Uint8Array): EntityLocationTable => {

    let {
        /**
         * The index of the first free entity in the free list or -1 if the free list is empty.
         */
        freeListHead,
        /**
         * The next index to use for a new entity once the free list is exhausted.
         */
        nextIndex,
        capacity,
    } = props;

    let array = createSharedArrayBuffer(capacity * 2 * 4);
    let entities = new Int32Array(array);
    if (entityData) {
        copyViewBytes(entityData, entities);
    }

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
                array = grow(array, capacity * 2 * 4);
                entities = new Int32Array(array);
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
    };
}
