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
import * as presentation from './todo-row-presentation.js';
import { styles } from './todo-row.css.js';
import { Entity } from '../../../../ecs/index.js';
import { customElement, property } from 'lit/decorators.js';

import { useObservableValues } from '../../../../lit/hooks/index.js';
import { TodoElement } from '../../todo-element.js';

export const tagName = 'data-todo-row';

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: TodoRow;
  }
}

@customElement(tagName)
export class TodoRow extends TodoElement {
  static styles = styles;

  @property({ type: Number })
  entity!: Entity;

  @property({ type: Number })
  index!: number;

  render() {
    const localized = { toggleComplete: 'Toggle complete', deleteTodo: 'Delete' } as const;
    const values = useObservableValues(() => ({
      todo: this.service.state.observe.entity(this.entity, this.service.state.archetypes.Todo),
    }));

    if (!values || !values.todo) return;

    return presentation.render({
      ...values,
      localized,
      todo: values.todo,
      toggleComplete: () => this.service.state.transactions.toggleComplete(this.entity),
      deleteTodo: () => this.service.state.transactions.deleteTodo(this.entity),
      dragTodo: this.service.state.transactions.dragTodo,
      index: this.index,
    });
  }
}
