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
import { describe, expect, it } from 'vitest';

import { createTodoStore } from '../create-todo-store.js';

describe('createTodo', () => {
  describe('when creating a new todo', () => {
    it('should return the created todo entity id and create the todo', () => {
      const t = createTodoStore();
      const todoId = createTodo(t, { name: 'Buy groceries' });
      expect(todoId).toBeGreaterThanOrEqual(0);
      const values = t.read(todoId);
      expect(values).toEqual({ id: todoId, name: 'Buy groceries', dragPosition: null, complete: false, todo: true, order: 0 });
    });
  });
});
