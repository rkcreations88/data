/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2024 Adobe
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
import './elements/todo-list/todo-list.js';
import './elements/todo-row/todo-row.js';
import './elements/todo-toolbar/todo-toolbar.js';
import './elements/todo-undo-redo/todo-undo-redo.js';
import { TodoElement } from './todo-element.js';
import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

export const tagName = 'data-todo';

@customElement(tagName)
export class TodoMainElement extends TodoElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 400px;
      max-height: 400px;
      overflow: hidden;
    }
    
    data-todo-toolbar {
      flex-shrink: 0;
    }
    
    data-todo-list {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
  `;

  render() {
    return html`
      <data-todo-toolbar></data-todo-toolbar>
      <data-todo-list></data-todo-list>
    `;
  }
}
