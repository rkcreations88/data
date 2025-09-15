/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2025 Adobe
 *  All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 **************************************************************************/
import { type TodoStore } from '../create-todo-store.js';

export const deleteAllTodos = (t: TodoStore) => {
  t.undoable = { coalesce: false };
  // query for all specific archetypes which satisfy the general todo archetype
  for (const archetype of t.queryArchetypes(t.archetypes.Todo.components)) {
    // traverse each row in reverse order
    // it's slightly more efficient to delete in this order
    // since we don't need to swap the final row to fill in the hole on delete.
    for (let row = archetype.rowCount - 1; row >= 0; row--) {
      // get the id for this row from the id column
      const entityId = archetype.columns.id.get(row);
      // delete the entity
      t.delete(entityId);
    }
  }
};
