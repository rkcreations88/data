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

import { describe, it, expect } from "vitest";
import { Database } from "./database.js";
import { Vec3 } from "../../math/index.js";

describe("Database.Plugin.create type inference", () => {
    it("should infer db type correctly", () => {
        const plugin = Database.Plugin.create(
            {
                components: {
                    position: Vec3.schema,
                    velocity: Vec3.schema,
                },
                resources: {
                    time: { default: 0 as number },
                    deltaTime: { default: 0 as number }
                },
                systems: {
                    physicsSystem: {
                        create: (db: any) => () => {
                            const entities = db.select(["position", "velocity"]);
                            const time: number = db.resources.time;
                            const dt: number = db.resources.deltaTime;
                        }
                    }
                }
            },
        );

        expect(plugin).toBeDefined();
        expect(plugin.components).toBeDefined();
        expect(plugin.resources).toBeDefined();
        expect(plugin.systems).toBeDefined();
    });

});
