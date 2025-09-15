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
import * as presentation from './todo-list-presentation.js';
import { styles } from './todo-list.css.js';
import { customElement } from 'lit/decorators.js';
import { css } from 'lit';

import { useObservableValues } from '../../../../lit/hooks/index.js';
import { TodoElement } from '../../todo-element.js';
import '../todo-row/todo-row.js';

export const tagName = 'data-todo-list';

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: TodoList;
  }
}

@customElement(tagName)
export class TodoList extends TodoElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
        height: 100%;
        width: 100%;
        overflow-y: auto;
        position: relative;
      }
    `
  ];

  render() {
    const values = useObservableValues(() => ({
      todos: this.service.dependentState.allTodos,
    }));

    if (!values) return;

    return presentation.render({
      ...values,
    });
  }
}
