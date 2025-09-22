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
