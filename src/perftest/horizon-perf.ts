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
import { shuffleArray } from "./helper-functions.js";
import { PerformanceTest } from "./perf-test.js";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
// uuid-imports.d.ts
async function createParticles(count: number) {
  const particlesIds: string[] = [];
  const components: Map<string, Map<string, any>> = new Map();
  const setComponent = (name: string, key: string, value: any) => {
    let component = components.get(name);
    if (!component) {
      component = new Map();
      components.set(name, component);
    }
    component.set(key, value);
  };
  const getComponent = (name: string, key: string) => {
    const component = components.get(name);
    if (!component) {
      return undefined;
    }
    return component.get(key);
  };
  const particles: any[] = [];
  for (let i = 0; i < count; i++) {
    const entity = uuidv4();
    particlesIds.push(entity);
    setComponent(entity, "color", { value: 0xff00ff });
    setComponent(entity, "mass", { value: 10 });
    setComponent(entity, "position", { x: i + 1, y: i + 1, z: i + 1 });
    setComponent(entity, "velocity", { x: - i, y: - i, z: - i });
    if ((i >> 0) % 2 === 0) {
      setComponent(entity, "visible", true);
    }
    if ((i >> 1) % 2 === 0) {
      setComponent(entity, "enabled", true);
    }
  }
  const enabledVisibleParticles = particlesIds.filter((id, i) => {
    return getComponent(id, "enabled") && getComponent(id, "visible");
  });

  return {
    particles,
    components,
    setComponent,
    getComponent,
    enabledVisibleParticles,
  };
}

const create = (() => {
  let count = 0;
  const setup = async (n: number) => {
    count = n;
  };
  const run = () => {
    createParticles(count);
  };
  const cleanup = async () => {};
  return { setup, run: run, cleanup, type: "create" } satisfies PerformanceTest;
})();

function createMoveParticlesPerformanceTest(options: { shuffle: boolean }) {
  let ecs: any;
  const setup = async (n: number) => {
    ecs = await createParticles(n);
    if (options.shuffle) {
      shuffleArray(ecs.particles);
    }
  };
  const run = () => {
    for (let i = 0; i < ecs.enabledVisibleParticles.length; i++) {
      const p = ecs.enabledVisibleParticles[i];
      const position = ecs.getComponent(p, "position");
      const velocity = ecs.getComponent(p, "velocity");
      const newPosition = { 
        x: position.x + velocity.x,
        y: position.y + velocity.y,
        z: position.z + velocity.z,
      };
      ecs.setComponent(p, "position", newPosition);
    }
  };
  const getVisibleEnabledPositions = () => {
    const values: number[] = [];
    for (let i = 0; i < ecs.enabledVisibleParticles.length; i++) {
      const p = ecs.enabledVisibleParticles[i];
      const position = ecs.getComponent(p, "position");
      values.push(position.x, position.y, position.z);
    }
    return values;
  }
  const cleanup = async () => {};
  return { setup, run: run, cleanup, getVisibleEnabledPositions, type: "move" } satisfies PerformanceTest;
}

const move_best = createMoveParticlesPerformanceTest({ shuffle: false });
const move_worst = createMoveParticlesPerformanceTest({ shuffle: true });

export const horizon = {
  create,
  move_best,
  move_worst,
};
