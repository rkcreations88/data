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
import { type Entity } from '@adobe/data/ecs';

import { type TodoStore } from '../create-todo-store.js';

export const deleteTodo = (t: TodoStore, id: Entity) => {
  t.undoable = { coalesce: false };
  t.delete(id);
  reorderTodos(t);
};
