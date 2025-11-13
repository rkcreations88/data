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
import { reorderTodos } from './reorder-todos.js';
import { Entity } from '../../../../../ecs/index.js';

import { type TodoStore } from '../create-todo-store.js';

export const dragTodo = (t: TodoStore, props: { todo: Entity; dragPosition: number; finalIndex?: number }) => {
  t.undoable = { coalesce: false };
  const { todo, dragPosition, finalIndex } = props;
  const completed = finalIndex !== undefined;
  if (!completed) {
    t.update(todo, { dragPosition });
  } else {
    // insert it with an order value 0.5 less than the final index
    t.update(todo, { dragPosition: null, order: finalIndex - 0.5 });
    // then we call reorderTodos which will reorder everything to integer order values
    reorderTodos(t); // this is an example of calling another transaction from a transaction
  }
};
