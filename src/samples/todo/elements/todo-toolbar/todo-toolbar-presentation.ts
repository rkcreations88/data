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
import { html } from 'lit';

import '../todo-undo-redo/index.js';
import '@spectrum-web-components/action-button/sp-action-button.js';

// Temporarily disable localization for the sample
// import { Localized, Unlocalized } from '../../../../services/locale-service/locale-service.js';

// Simplified localization for sample - using static strings
const localizedStrings = {
  add1Todo: 'Add 1 Todo',
  add10Todos: 'Add 10 Todos',
  add1000Todos: 'Add 1000 Todos',
  clearCompleted: 'Clear Completed',
  toggleAll: 'Toggle All',
  todoCount: 'todos',
  completedCount: 'completed',
} as const;

type RenderArgs = {
  localized: typeof localizedStrings;
  todoCount: number;
  completedCount: number;
  isGenerating: boolean;
  createBulkTodos: (count: number) => void;
  clearCompleted: () => void;
  toggleAll: () => void;
};

export function render(args: RenderArgs) {
  const { localized, todoCount, completedCount, isGenerating, createBulkTodos, clearCompleted, toggleAll } = args;

  return html`
    <div class="todo-toolbar">
      <div class="toolbar-left">
        <data-todo-undo-redo></data-todo-undo-redo>
        <sp-action-button @click=${toggleAll} ?disabled=${isGenerating} quiet> ${localized.toggleAll} </sp-action-button>
      </div>

      <div class="toolbar-center">
        <sp-action-button @click=${() => createBulkTodos(1)} ?disabled=${isGenerating}> ${localized.add1Todo} </sp-action-button>
        <sp-action-button @click=${() => createBulkTodos(10)} ?disabled=${isGenerating}> ${localized.add10Todos} </sp-action-button>
        <sp-action-button @click=${() => createBulkTodos(1000)} ?disabled=${isGenerating}> ${localized.add1000Todos} </sp-action-button>
      </div>

      <div class="toolbar-right">
        <sp-action-button @click=${clearCompleted} ?disabled=${completedCount === 0 || isGenerating} quiet>
          ${localized.clearCompleted}
        </sp-action-button>
        <span class="todo-stats"> ${completedCount} / ${todoCount} </span>
      </div>
    </div>
  `;
}
