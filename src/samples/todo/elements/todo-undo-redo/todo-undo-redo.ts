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
