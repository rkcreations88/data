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
