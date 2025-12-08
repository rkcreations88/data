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
import * as presentation from './todo-toolbar-presentation.js';
import { styles } from './todo-toolbar.css.js';
import { Observe } from '../../../../observe/index.js';
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
      completedCount: Observe.withMap(this.service.dependentState.completeTodos, (todos: unknown) => (todos as { length: number }).length),
      todoCount: Observe.withMap(this.service.dependentState.allTodos, (todos: unknown) => (todos as { length: number }).length),
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
