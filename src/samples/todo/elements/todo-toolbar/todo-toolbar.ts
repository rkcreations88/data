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
import * as presentation from './todo-toolbar-presentation.js';
import { styles } from './todo-toolbar.css.js';
import { withMap } from '../../../../observe/index.js';
import { customElement } from 'lit/decorators.js';
import { css } from 'lit';

import { useObservableValues } from '../../../../lit/hooks/index.js';
import { TodoElement } from '../../todo-element.js';

export const tagName = 'data-todo-toolbar';

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: TodoToolbar;
  }
}

@customElement(tagName)
export class TodoToolbar extends TodoElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
        flex-shrink: 0;
        width: 100%;
      }
    `
  ];

  render() {
    const localized = {
      add1Todo: 'Add 1 Todo',
      add10Todos: 'Add 10 Todos',
      add1000Todos: 'Add 1000 Todos',
      clearCompleted: 'Clear Completed',
      toggleAll: 'Toggle All',
      todoCount: 'todos',
      completedCount: 'completed',
    } as const;
    const values = useObservableValues(() => ({
      completedCount: withMap(this.service.dependentState.completeTodos, todos => todos.length),
      todoCount: withMap(this.service.dependentState.allTodos, todos => todos.length),
    }));

    if (!values) return;

    return presentation.render({
      ...values,
      localized,
      isGenerating: false,
      createBulkTodos: this.service.state.transactions.createBulkTodos,
      clearCompleted: () => {
        // Placeholder - would need to implement this transaction
      },
      toggleAll: () => {
        // Placeholder - would need to implement this transaction
      },
    });
  }
}
