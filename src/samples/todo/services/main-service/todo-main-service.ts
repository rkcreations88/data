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
import { PersistenceService, UndoRedoService } from '../../../../ecs/index.js';
import { Service } from '../../../../service/index.js';
import { DependentStateService } from '../dependent-state-service/dependent-state-service.js';
import { TodoStateService } from '../state-service/todo-state-service.js';

export interface TodoMainService extends Service {
  readonly serviceName: string;
  state: TodoStateService;
  dependentState: DependentStateService;
  undoRedo: UndoRedoService;
  persistence: PersistenceService;
}

export type TodoCoreService = Omit<TodoMainService, 'dependentState'>;

/**
 * The main service as used by the UI. We only allow access to the observe and transactions properties.
 */
export type TodoUIMainService = Omit<TodoMainService, 'state'> & { state: Omit<TodoStateService, 'resources'> };
