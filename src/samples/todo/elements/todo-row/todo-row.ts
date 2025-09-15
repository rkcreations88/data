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
import * as presentation from './todo-row-presentation.js';
import { styles } from './todo-row.css.js';
import { Entity } from '@adobe/data/ecs';
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
