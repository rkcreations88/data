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
import { Entity } from '@adobe/data/ecs';
import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '../todo-row/todo-row.js';

type RenderArgs = {
  todos: readonly Entity[];
};

export function render(args: RenderArgs) {
  return html`
    <div class="todo-list">
      ${repeat(
    args.todos,
    todo => todo,
    (todo, index) => html` <data-todo-row .entity=${todo} .index=${index}></data-todo-row> `
  )}
    </div>
  `;
}
