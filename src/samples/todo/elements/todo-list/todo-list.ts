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
