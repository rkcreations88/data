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

import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/action-group/sp-action-group.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-redo.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-undo.js';

// Temporarily disable localization for the sample
// import { Localized, Unlocalized } from '../../../../services/locale-service/locale-service.js';

// Simplified localization for sample - using static strings
const localizedStrings = {
  undo: 'Undo',
  redo: 'Redo',
} as const;

type RenderArgs = {
  localized: typeof localizedStrings;
  hasUndo: boolean;
  hasRedo: boolean;
  undo: () => void;
  redo: () => void;
};

export function render(args: RenderArgs) {
  const { localized, hasUndo, hasRedo, undo, redo } = args;

  return html`
    <sp-action-group>
      <sp-action-button @click=${undo} ?disabled=${!hasUndo} quiet>
        <sp-icon-undo slot="icon"></sp-icon-undo>
        ${localized.undo}
      </sp-action-button>
      <sp-action-button @click=${redo} ?disabled=${!hasRedo} quiet>
        <sp-icon-redo slot="icon"></sp-icon-redo>
        ${localized.redo}
      </sp-action-button>
    </sp-action-group>
  `;
}
