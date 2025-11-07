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
import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .todo-row {
    --todo-row-height: 56px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--spectrum-spacing-200);
    padding: var(--spectrum-spacing-200) var(--spectrum-spacing-300);
    border-bottom: 1px solid var(--spectrum-gray-200);
    min-height: var(--todo-row-height);
    height: var(--todo-row-height);
    contain: layout paint style;            /* or at least paint/layout */
    content-visibility: auto;               /* skip offscreen work: https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility */
    contain-intrinsic-size: 500px var(--todo-row-height);     /* reserve space so auto can skip paint: https://developer.mozilla.org/en-US/docs/Web/CSS/contain-intrinsic-size */
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  .todo-row.dragging {
    background-color: var(--spectrum-gray-100);
    z-index: 100;
    box-shadow: 0 0 10px var(--spectrum-gray-300);
  }

  .todo-row:hover {
    background-color: var(--spectrum-gray-100);
  }

  .todo-name {
    flex: 1;
    font-size: var(--spectrum-font-size-100);
    line-height: var(--spectrum-line-height-100);
    color: var(--spectrum-gray-800);
  }

  sp-checkbox {
    flex-shrink: 0;
  }

  sp-action-button {
    flex-shrink: 0;
  }
`; 