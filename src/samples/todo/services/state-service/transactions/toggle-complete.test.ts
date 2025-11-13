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
import { toggleComplete } from './toggle-complete.js';
import { describe, expect, it } from 'vitest';

import { createTodoStore } from '../create-todo-store.js';

describe('toggleComplete', () => {
  describe('when toggling a complete todo', () => {
    it('should mark it as incomplete', () => {
      const t = createTodoStore();
      const todoId = createTodo(t, { name: 'Test todo' });
      // First mark as complete
      t.update(todoId, { complete: true });
      expect(t.read(todoId)?.complete).toBe(true);

      // Then toggle it
      toggleComplete(t, todoId);
      expect(t.read(todoId)?.complete).toBe(false);
    });
  });

  describe('when toggling an incomplete todo', () => {
    it('should mark it as complete', () => {
      const t = createTodoStore();
      const todoId = createTodo(t, { name: 'Test todo' });
      expect(t.read(todoId)?.complete).toBe(false);

      toggleComplete(t, todoId);
      expect(t.read(todoId)?.complete).toBe(true);
    });
  });

  describe('when toggling multiple times', () => {
    it('should alternate between complete and incomplete', () => {
      const t = createTodoStore();
      const todoId = createTodo(t, { name: 'Test todo' });
      expect(t.read(todoId)?.complete).toBe(false);

      // First toggle
      toggleComplete(t, todoId);
      expect(t.read(todoId)?.complete).toBe(true);

      // Second toggle
      toggleComplete(t, todoId);
      expect(t.read(todoId)?.complete).toBe(false);

      // Third toggle
      toggleComplete(t, todoId);
      expect(t.read(todoId)?.complete).toBe(true);
    });
  });

  describe('when toggling a non-existent todo', () => {
    it('should not throw an error and should no-op', () => {
      const t = createTodoStore();
      const nonExistentId = 999;
      expect(t.read(nonExistentId)).toBeNull();

      // Should not throw
      expect(() => toggleComplete(t, nonExistentId)).not.toThrow();

      // Should still be null
      expect(t.read(nonExistentId)).toBeNull();
    });
  });

  describe('when toggling with invalid entity id', () => {
    it('should not throw an error and should no-op', () => {
      const t = createTodoStore();
      const invalidId = -1;

      // Should not throw
      toggleComplete(t, invalidId);
      expect(() => toggleComplete(t, invalidId)).not.toThrow();
    });
  });
});
