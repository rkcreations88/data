# Scheduler Plugin

A Database plugin that automatically executes all registered systems in a `requestAnimationFrame` loop.

## Overview

The Scheduler Plugin provides automatic system execution with frame timing, FPS tracking, and full control over the execution loop. It's designed as a composable plugin that can be added to any database.

## Features

- 🔄 **Automatic Execution**: Runs all systems in a RAF loop
- ⏱️ **Frame Timing**: Provides `deltaTime`, `elapsedTime`, and `frame` resources
- 📊 **FPS Tracking**: Calculates and exposes current FPS
- 🎮 **Full Control**: Start, stop, pause, resume, or step through frames
- 🔀 **Respects Dependencies**: Executes systems in the correct order
- ⚡ **Parallel Execution**: Runs independent systems in parallel
- 🔁 **Async Support**: Properly awaits async systems

## Installation

```typescript
import { Database } from "@adobe/data";
import { createSchedulerPlugin } from "@adobe/data/ecs/plugins";
```

## Basic Usage

```typescript
// Create your game plugin
const GamePlugin = Database.Plugin.create({
  components: {
    position: { type: "object", default: { x: 0, y: 0 } },
    velocity: { type: "object", default: { x: 0, y: 0 } }
  },
  systems: {
    updatePhysics: {
      create: (db) => () => {
        const deltaTime = db.resources.deltaTime;
        const entities = db.select(["position", "velocity"]);
        
        for (const entity of entities) {
          const pos = db.get(entity, "position");
          const vel = db.get(entity, "velocity");
          
          db.update(entity, {
            position: {
              x: pos.x + vel.x * deltaTime,
              y: pos.y + vel.y * deltaTime
            }
          });
        }
      }
    }
  }
});

// Create database with scheduler
const db = Database.create(
  Database.Plugin.create(GamePlugin, createSchedulerPlugin(), {})
);

// Start the loop
db.resources.scheduler.start();
```

## Options

```typescript
createSchedulerPlugin({
  autoStart: true,    // Start automatically (default: false)
  targetFps: 60       // Target FPS for metrics (default: 60)
});
```

## Control Interface

### Start / Stop

```typescript
// Start the scheduler
db.resources.scheduler.start();

// Stop the scheduler
db.resources.scheduler.stop();
```

### Pause / Resume

```typescript
// Pause execution (RAF continues but systems don't run)
db.resources.scheduler.pause();

// Resume execution
db.resources.scheduler.resume();
```

### Step Through Frames

```typescript
// Execute exactly one frame (useful for debugging)
await db.resources.scheduler.step();
```

### Query State

```typescript
// Check if running
const isRunning = db.resources.scheduler.isRunning; // boolean

// Check if paused
const isPaused = db.resources.scheduler.isPaused; // boolean

// Get current FPS
const fps = db.resources.scheduler.fps; // number

// Get frame count since start
const frames = db.resources.scheduler.frameCount; // number
```

## Timing Resources

The scheduler automatically updates these resources each frame:

```typescript
// Time since last frame in seconds
const deltaTime = db.resources.deltaTime;

// Total time since scheduler started in seconds
const elapsedTime = db.resources.elapsedTime;

// Current frame number (starts at 0)
const frame = db.resources.frame;
```

## System Scheduling

Systems are executed in the order determined by their dependencies. Systems in the same tier (no dependencies between them) run in parallel using `Promise.all`.

```typescript
const plugin = Database.Plugin.create({
  components: {},
  systems: {
    inputSystem: {
      create: (db) => () => {
        // Runs first
      }
    },
    physicsSystem: {
      create: (db) => () => {
        // Runs after input
      },
      schedule: {
        after: ["inputSystem"]
      }
    },
    audioSystem: {
      create: (db) => () => {
        // Runs in parallel with physics (no dependencies)
      }
    },
    renderSystem: {
      create: (db) => () => {
        // Runs last
      },
      schedule: {
        after: ["physicsSystem", "audioSystem"]
      }
    }
  }
});
```

Execution order:
1. Tier 1 (parallel): `inputSystem`
2. Tier 2 (parallel): `physicsSystem`, `audioSystem`
3. Tier 3 (parallel): `renderSystem`

## Async Systems

The scheduler properly awaits async systems:

```typescript
const plugin = Database.Plugin.create({
  components: {},
  systems: {
    loadAssets: {
      create: (db) => async () => {
        const response = await fetch('/api/assets');
        const data = await response.json();
        // Process data...
      }
    }
  }
});
```

## Examples

### Game Loop with Fixed Logic

```typescript
const GamePlugin = Database.Plugin.create({
  components: {
    position: { type: "object", default: { x: 0, y: 0 } },
    velocity: { type: "object", default: { x: 1, y: 1 } }
  },
  archetypes: {
    Particle: ["position", "velocity"]
  },
  systems: {
    updatePositions: {
      create: (db) => () => {
        const dt = db.resources.deltaTime;
        const entities = db.select(["position", "velocity"]);
        
        for (const entity of entities) {
          const pos = db.get(entity, "position");
          const vel = db.get(entity, "velocity");
          db.update(entity, {
            position: { x: pos.x + vel.x * dt, y: pos.y + vel.y * dt }
          });
        }
      }
    }
  }
});

const db = Database.create(
  Database.Plugin.create(
    GamePlugin,
    createSchedulerPlugin({ autoStart: true }),
    {}
  )
);

// Spawn some particles
for (let i = 0; i < 100; i++) {
  db.archetypes.Particle.insert({
    position: { x: Math.random() * 800, y: Math.random() * 600 },
    velocity: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }
  });
}
```

### Debug Mode with Manual Stepping

```typescript
const db = Database.create(
  Database.Plugin.create(GamePlugin, createSchedulerPlugin(), {})
);

// Don't start automatically - step manually
document.getElementById('stepButton').addEventListener('click', async () => {
  await db.resources.scheduler.step();
  console.log(`Frame ${db.resources.frame}, FPS: ${db.resources.scheduler.fps}`);
});
```

### Pause on Focus Loss

```typescript
const db = Database.create(
  Database.Plugin.create(
    GamePlugin,
    createSchedulerPlugin({ autoStart: true }),
    {}
  )
);

window.addEventListener('blur', () => {
  db.resources.scheduler.pause();
});

window.addEventListener('focus', () => {
  db.resources.scheduler.resume();
});
```

## Performance Considerations

- The scheduler filters itself out of the execution loop to avoid recursion
- Systems in the same tier execute in parallel using `Promise.all`
- FPS is calculated as a rolling average over 60 frames
- The RAF loop only continues if the scheduler is running and not paused

## Architecture Notes

The scheduler is **not part of the core Database** - it's a plugin that can be added or removed. This allows:
- Apps that don't need automatic execution to skip the scheduler
- Different scheduling strategies (fixed timestep, server-side, event-based)
- Easy testing without a running loop
- Composability with other plugins

The scheduler system itself is a no-op - all execution logic happens in the RAF callback that's set up during system creation.

