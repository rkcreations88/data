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
import { TodoStore } from '../create-todo-store.js';

/**
 * Ensures each todo has an monotonically increasing integer order value.
 * You might call this after inserting a todo with a floating point order value for insertion.
 */
export const reorderTodos = (t: TodoStore) => {
  const todos = t.select(t.archetypes.Todo.components, { order: { order: true } });
  for (let i = 0; i < todos.length; i++) {
    t.update(todos[i], { order: i });
  }
};
