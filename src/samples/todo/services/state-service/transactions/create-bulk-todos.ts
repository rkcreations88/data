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
import { createTodo } from './create-todo.js';

import { type TodoStore } from '../create-todo-store.js';

export const createBulkTodos = (t: TodoStore, count: number) => {
  t.undoable = { coalesce: false };
  const currentCount = t.archetypes.Todo.rowCount;
  for (let i = 0; i < count; i++) {
    createTodo(t, { name: `Todo ${currentCount + i}`, complete: false });
  }
};
