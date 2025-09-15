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
import { TodoCoreService, TodoMainService } from './todo-main-service.js';
import { createStoragePersistenceService, createUndoRedoService } from '../../../../ecs/index.js';
import { createDependentStateService } from '../dependent-state-service/create-dependent-state-service.js';
import { createTodoDatabase } from '../state-service/create-todo-database.js';
import { todoStoreSchemaVersion } from '../state-service/create-todo-store.js';
import { TodoStateService } from '../state-service/todo-state-service.js';

/**
 * Initializes any core services and returns a new todo main service.
 */
export async function createMainService(services: {
  state?: TodoStateService;
} = {}): Promise<TodoMainService> {
  {
    const {
      state = createTodoDatabase(),
      ...rest
    } = services;

    state.transactions.createTodo({ name: 'Buy groceries' });
    state.transactions.createTodo({ name: 'Pickup dry cleaning' });
    state.transactions.createTodo({ name: 'Buy flowers', complete: true });

    const persistence = await createStoragePersistenceService({
      database: state,
      storage: sessionStorage,
      defaultFileId: `todo-database-v${todoStoreSchemaVersion}`,
      autoSaveOnChange: true,
      autoLoadOnStart: true,
    });

    // Create the undo-redo actions
    const undoRedo = createUndoRedoService(state);

    // The core service is what we call the service without the dependent state service
    const coreService = {
      serviceName: 'todo-core-service' as const,
      ...rest,
      state,
      undoRedo,
      persistence,
    } satisfies TodoCoreService;

    // We create the dependent state from the core service.
    const dependentState = createDependentStateService(coreService);

    return {
      ...coreService,
      dependentState,
    } satisfies TodoMainService;
  }
}
