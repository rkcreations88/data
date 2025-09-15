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
import { css } from 'lit';

export const styles = css`
  .todo-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spectrum-spacing-200) var(--spectrum-spacing-300);
    background-color: var(--spectrum-gray-100);
    border-bottom: 1px solid var(--spectrum-gray-300);
    gap: var(--spectrum-spacing-200);
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--spectrum-spacing-100);
  }

  .toolbar-center {
    flex: 1;
    justify-content: center;
  }

  .todo-stats {
    font-size: var(--spectrum-font-size-100);
    color: var(--spectrum-gray-600);
    margin-left: var(--spectrum-spacing-200);
    width: 100px;
  }
`; 