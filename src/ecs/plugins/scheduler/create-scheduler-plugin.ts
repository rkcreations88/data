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

import { Database } from "../../database/database.js";
import type { SchedulerControl, SchedulerOptions } from "./scheduler.js";

/**
 * Creates a scheduler plugin that executes all systems in a requestAnimationFrame loop.
 * 
 * The scheduler adds the following resources to the database:
 * - `scheduler`: Control interface for starting/stopping the loop
 * - `deltaTime`: Time since last frame in seconds
 * - `elapsedTime`: Total elapsed time since start in seconds
 * - `frame`: Current frame number
 * 
 * @param options - Configuration options for the scheduler
 * @returns A Database.Plugin that manages system execution
 * 
 * @example
 * ```typescript
 * const db = Database.create(
 *   Database.Plugin.create(MyGamePlugin, createSchedulerPlugin({ autoStart: true }), {})
 * );
 * 
 * // Control the scheduler
 * db.resources.scheduler.pause();
 * db.resources.scheduler.resume();
 * await db.resources.scheduler.step(); // Execute one frame
 * ```
 */
export const createSchedulerPlugin = (options: SchedulerOptions = {}) => {
    const { autoStart = false, targetFps = 60 } = options;

    return Database.Plugin.create({
        components: {},
        resources: {
            scheduler: {
                default: null as any as SchedulerControl // Will be set during system creation
            },
            deltaTime: {
                default: 0 as number
            },
            elapsedTime: {
                default: 0 as number
            },
            frame: {
                default: 0 as number
            }
        },
        archetypes: {},
        transactions: {},
        systems: {
            schedulerSystem: {
                create: (db: Database<any, any, any, any, any>) => {
                    // State for the scheduler
                    let rafId: number | null = null;
                    let isRunning = false;
                    let isPaused = false;
                    let frameCount = 0;
                    let lastFrameTime = 0;
                    let fps = 0;

                    // FPS calculation
                    const fpsWindow: number[] = [];
                    const fpsWindowSize = 60;

                    const updateFps = (frameTime: number) => {
                        fpsWindow.push(frameTime);
                        if (fpsWindow.length > fpsWindowSize) {
                            fpsWindow.shift();
                        }
                        const avgFrameTime = fpsWindow.reduce((a, b) => a + b, 0) / fpsWindow.length;
                        fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0;
                    };

                    // Execute one frame
                    const executeFrame = async () => {
                        const startTime = performance.now();
                        const now = Date.now();

                        // Update timing resources
                        const deltaMs = now - lastFrameTime;
                        (db.resources as any).deltaTime = deltaMs / 1000;
                        (db.resources as any).elapsedTime += db.resources.deltaTime;
                        (db.resources as any).frame = frameCount;
                        lastFrameTime = now;
                        frameCount++;

                        // Execute all systems in order (excluding schedulerSystem itself)
                        for (const tier of db.system.order) {
                            const systemsInTier = tier.filter((name: string) => name !== "schedulerSystem");

                            // Execute tier in parallel
                            await Promise.all(
                                systemsInTier.map((name: string) => db.system.functions[name]())
                            );
                        }

                        // Calculate FPS
                        const frameTime = performance.now() - startTime;
                        updateFps(frameTime);

                        // Continue loop if running and not paused
                        if (isRunning && !isPaused) {
                            rafId = requestAnimationFrame(() => executeFrame());
                        }
                    };

                    // Create control interface
                    const control: SchedulerControl = {
                        start() {
                            if (isRunning) return;
                            isRunning = true;
                            isPaused = false;
                            lastFrameTime = Date.now();
                            frameCount = 0;
                            (db.resources as any).frame = 0;
                            (db.resources as any).elapsedTime = 0;
                            rafId = requestAnimationFrame(() => executeFrame());
                        },

                        stop() {
                            if (!isRunning) return;
                            isRunning = false;
                            isPaused = false;
                            if (rafId !== null) {
                                cancelAnimationFrame(rafId);
                                rafId = null;
                            }
                        },

                        pause() {
                            isPaused = true;
                        },

                        resume() {
                            if (!isPaused) return;
                            isPaused = false;
                            lastFrameTime = Date.now();
                            if (isRunning && rafId === null) {
                                rafId = requestAnimationFrame(() => executeFrame());
                            }
                        },

                        async step() {
                            const wasPaused = isPaused;
                            const wasRunning = isRunning;
                            isPaused = true;
                            isRunning = true;
                            await executeFrame();
                            isPaused = wasPaused;
                            isRunning = wasRunning;
                        },

                        get isRunning() { return isRunning; },
                        get isPaused() { return isPaused; },
                        get fps() { return fps; },
                        get frameCount() { return frameCount; }
                    };

                    // Set the control interface as a resource
                    (db.resources as any).scheduler = control;

                    // Auto-start if requested
                    if (autoStart) {
                        control.start();
                    }

                    // Return a no-op system function (the real work happens in the RAF loop)
                    return () => {
                        // No-op: The scheduler manages its own execution through RAF
                    };
                }
            }
        }
    });
};

