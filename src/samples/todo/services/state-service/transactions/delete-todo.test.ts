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
import { deleteTodo } from './delete-todo.js';
import { describe, expect, it } from 'vitest';

import { createTodoStore } from '../create-todo-store.js';

describe('deleteTodo', () => {
  describe('when deleting a todo', () => {
    it('should remove it from the archetype', () => {
      const t = createTodoStore();
      const todoA = createTodo(t, { name: 'A' });
      const todoB = createTodo(t, { name: 'B' });
      const todoC = createTodo(t, { name: 'C' });
      deleteTodo(t, todoA);
      const values = t.read(todoA);
      expect(values).toBeNull();
      const valuesB = t.read(todoB);
      expect(valuesB).toBeDefined();
      const valuesC = t.read(todoC);
      expect(valuesC).toBeDefined();
      expect(t.archetypes.Todo.rowCount).toBe(2);
    });
  });
});
