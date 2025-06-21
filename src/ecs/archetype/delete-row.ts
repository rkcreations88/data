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
import * as TABLE from "../../table/index.js";
import { Archetype } from "./archetype.js";
import { CoreComponents } from "../core-components.js";
import { EntityLocationTable } from "../entity-location-table/entity-location-table.js";

/**
 * Deletes a row from the archetype and updates the entity location table for any row which may have been moved into it's position.
 * Does NOT modify the deleted row's entity location.
 */
export const deleteRow = <C extends CoreComponents>(archetype: Archetype<C>, row: number, entityLocationTable: EntityLocationTable): void => {
    const movedARowToFillHole = TABLE.deleteRow(archetype, row);
    if (movedARowToFillHole) {
        const movedId = archetype.columns.id.get(row);
        entityLocationTable.update(movedId, { archetype: archetype.id, row });
    }
}
