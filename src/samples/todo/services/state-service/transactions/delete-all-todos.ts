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
