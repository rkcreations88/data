# 📋 Plan: data-react-pixie Package

**Status**: 📋 PLANNED  
**Goal**: Create a sample app that renders ECS entity data (position, rotation, sprite type) with PixiJS React — raw sprite data in the ECS, rendered via React Pixi

---

## Overview

**Why**: Demonstrates using the ECS as the source of truth for renderable sprite data. Entities have position, rotation, and a type tag; React Pixi renders them. No duplication — the database is the sprite.

**What**: A new package `data-react-pixie` with a database plugin that defines entity components for 2D sprites. Entities use `sprite: { enum: ["bunny", "fox"] }` to discriminate type. A ticker transaction updates rotation each frame. React Pixi renders every entity from observed data.

**Gap**: No sample shows ECS entities (components + archetypes) driving a canvas renderer. This establishes the pattern.

---

## ECS Schema: Components & Archetypes

**Components** (from `@adobe/data`):
- `position`: `Vec2.schema` — [x, y]
- `rotation`: `F32.schema` — angle in radians
- `sprite`: `{ enum: ["bunny", "fox"] }` — discriminates sprite type

**Archetypes**:
- `Sprite`: `['position', 'rotation', 'sprite']` — all renderable entities

**Transactions**:
- `tick(delta)`: updates `rotation` for all entities
- `createSprite(args: { position, rotation, sprite })`: insert entity with initial values

---

## Reference: PixiJS React & Data

- **Assets**: `https://react.pixijs.io/v7/img/bunny.png`; add a second asset for fox (or reuse/placeholder)
- **Stack**: `pixi.js@7` + `@pixi/react@7`
- **Observe**: `db.observe.select(components, options)` → entity IDs; `db.observe.entity(id, archetype)` → entity values
- **Pattern**: Parent observes entity list; each child observes entity data (like TodoRow with observe.entity)

---

## Task: Create data-react-pixie Package

**Requirements**:
- Given the workspace, should add `packages/data-react-pixie` to pnpm-workspace.yaml
- Given data-react-hello structure, should mirror package layout (Vite, React, tsconfig)
- Given PixiJS React docs, should add `pixi.js@^7`, `@pixi/react@^7` as dependencies
- Given @adobe/data-react, should add `@adobe/data` and `@adobe/data-react` as workspace deps

---

## Task: Pixie Database Plugin (ECS)

**Requirements**:
- Given the schema, should define components: `position: Vec2.schema`, `rotation: F32.schema`, `sprite: { enum: ["bunny", "fox"] }`
- Given the archetypes, should define `Sprite` with `['position', 'rotation', 'sprite']`
- Given the transactions, should add `tick(delta)` to advance rotation for all entities
- Given the sample, should add `createSprite(args)` to insert entities with initial position, rotation, sprite
- Given the plugin, should initialize the database with a few bunnies and foxes (different sprite values) at different positions/rotations

---

## Task: Ticker Integration

**Requirements**:
- Given PixiJS or requestAnimationFrame, should run a ticker that calls `tick(delta)` each frame
- Given React, should run the ticker inside a `useEffect` that cleans up on unmount
- Given the database, should pass delta time so rotation speed is frame-rate independent

---

## Task: Sprite Components (observe + render)

**Requirements**:
- Given `observe.select`, should observe entity IDs for Sprite archetype (`['position', 'rotation', 'sprite']`)
- Given `observe.entity`, should observe each entity's position, rotation, and sprite for rendering
- Given PixiJS React, should render `Stage` and map over entities to render `Sprite` with `image`, `x`, `y`, `rotation`, `anchor`
- Given `sprite`, should choose the correct image URL (bunny vs fox)

---

## Task: App Entry and Initialization

**Requirements**:
- Given the sample, should provide `index.html`, `main.tsx` mounting the app
- Given DatabaseProvider, should wrap the Stage in DatabaseProvider with the pixie plugin
- Given the database, should initialize entities on first run (createSprite with sprite "bunny" or "fox")
- Given the ticker, should start the ticker when the app mounts

---

## Suggested Order of Execution

1. Create package structure (package.json, tsconfig, vite.config, index.html)
2. Add pixie plugin (components, archetypes, transactions, seed entities)
3. Implement ticker effect
4. Implement Sprite entity component (observe.entity per entity)
5. Implement Sprites container (observe.select, map to Sprite)
6. Wire App and main entry

---

## Dependencies

```json
{
  "dependencies": {
    "@adobe/data": "workspace:*",
    "@adobe/data-react": "workspace:*",
    "pixi.js": "^7.4.0",
    "@pixi/react": "^7.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

---

## File Structure

```
packages/data-react-pixie/
  src/
    pixie-plugin.ts      # ECS: components, archetypes, transactions, init
    SpriteEntity.tsx     # Observes one entity, renders Sprite
    Sprites.tsx          # Observes entity list, maps to SpriteEntity
    App.tsx
    main.tsx
  index.html
  package.json
  vite.config.ts
  tsconfig.json
```
