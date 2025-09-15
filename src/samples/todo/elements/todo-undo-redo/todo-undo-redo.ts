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
import * as presentation from './todo-undo-redo-presentation.js';
import { styles } from './todo-undo-redo.css.js';
import { customElement } from 'lit/decorators.js';

import { useObservableValues } from '../../../../lit/hooks/index.js';
import { TodoElement } from '../../todo-element.js';

export const tagName = 'data-todo-undo-redo';

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: TodoUndoRedo;
  }
}

@customElement(tagName)
export class TodoUndoRedo extends TodoElement {
  static styles = styles;

  render() {
    const localized = { undo: 'Undo', redo: 'Redo' } as const;
    const values = useObservableValues(() => ({
      hasUndo: this.service.undoRedo.undoEnabled,
      hasRedo: this.service.undoRedo.redoEnabled,
    }));

    if (!values) return;

    return presentation.render({
      ...values,
      localized,
      undo: this.service.undoRedo.undo,
      redo: this.service.undoRedo.redo,
    });
  }
}
