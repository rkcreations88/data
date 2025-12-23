import { Database } from "./ecs/database/database.js";

const aSchema = Database.Plugin.create({
    components: { a: { type: "number" } },
    archetypes: { one: ["a"] }
});

const bSchema = Database.Plugin.create({
    components: { x: { type: "number" } },
});

const cSchema = Database.Plugin.create({
    components: { m: { type: "number" } },
}, [aSchema, bSchema]);

// What is the actual type?
type TX = typeof cSchema.transactions;
type TXKeys = keyof TX;
