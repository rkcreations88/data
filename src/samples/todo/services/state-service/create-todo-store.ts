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
import { createStore } from '../../../../ecs/index.js';
import { F32Schema, Nullable, TrueSchema } from '../../../../schema/index.js';

// Increment this value if you change the schema in a non-backwards compatible way
export const todoStoreSchemaVersion = 1;
export const createTodoStore = () => {
  return createStore(
    //  components
    {
      todo: TrueSchema, // a tag that indicates an entity is a todo item.
      complete: { type: 'boolean' },
      name: { type: 'string' },
      order: F32Schema,
      dragPosition: Nullable(F32Schema), // null = not being dragged
    },
    //  resources
    {
      displayCompleted: { type: 'boolean', default: false },
    },
    //  archetypes
    {
      Todo: ['todo', 'complete', 'name', 'order', 'dragPosition'],
    }
  );
};

export type TodoStore = ReturnType<typeof createTodoStore>;
