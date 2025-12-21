import { Vec3 } from "../../../../math/index.js";
import { Time } from "../../../../schema/index.js";
import { Database } from "../../../index.js";
import { create } from "./create.js";
import { describe, expect, it } from "vitest";

describe("create", () => {
    it("should create a system factory", () => {
        const graphics = create(
            Database.Schema.create({
                components: {
                    position: Vec3.schema,
                    velocity: Vec3.schema,
                },
                resources: {
                    time: Time.schema,
                },
                archetypes: {
                    Position: ["position"],
                },
                transactions: {
                    createPosition(store) {
                        return store.archetypes.Position.insert({
                            position: [1, 2, 3],
                        });
                    }
                }
            }),
            {
                update: { name: "update" },
                render: { name: "render" },
            },
            (db) => ({
                update: () => {
                },
                render: () => {
                },
            })
        );

        expect(graphics.schema).toBeDefined();
        expect(graphics.systems).toBeDefined();
        expect(graphics.create).toBeDefined();

        expect(graphics.systems.render.name).toBe("render");
        expect(graphics.systems.update.name).toBe("update");
    });
});