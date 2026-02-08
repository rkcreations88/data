// © 2026 Adobe. MIT License. See /LICENSE for details.

import {
  Application,
} from '@pixi/react';
import { DatabaseProvider } from "@adobe/data-react";
import { pixiePlugin } from './pixie-plugin.js';
import { SpriteContainer } from './sprite-container.js';
import { Tick } from './tick.js';

export function App() {
  return (
    <DatabaseProvider plugin={pixiePlugin}>
      <Application background="beige" width={640} height={480}>
        <Tick />
        <SpriteContainer />
      </Application>
    </DatabaseProvider>
  );
}

