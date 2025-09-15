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
import { type TodoStore } from '../create-todo-store.js';

export const createTodo = (t: TodoStore, props: { name: string; complete?: boolean }) => {
  t.undoable = { coalesce: false };
  const order = t.archetypes.Todo.rowCount;
  // TODO: Figure out why the order seems to be zero on each added row.
  return t.archetypes.Todo.insert({
    ...props,
    complete: props.complete ?? false,
    todo: true,
    order,
    dragPosition: null,
  });
};
