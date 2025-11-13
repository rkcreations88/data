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
