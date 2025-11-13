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
