import { TrueSchema } from "../../../schema/true.js";
import { createDatabaseSchema } from "./create-database-schema.js";

// just a compile time test which is why we're using -test.ts extension instead of .test.ts

createDatabaseSchema(
    {
        velocity: { type: "number" },
        particle: TrueSchema,
    },
    {
        mousePosition: { type: "number", default: 0 },
        fooPosition: { type: "number", default: 0 },
    },
    {
        bar: ["particle", "velocity"],
        // @ts-expect-error
        foo: ["particle", "velocity2"] // should throw error because velocity2 is not a component
    },
    (store) => {
        return ({
            setMousePosition: (position: number) => {
                store.resources.mousePosition = position;
                // @ts-expect-error
                store.resources.mousePosition2 = position;
            },
        })
    }
)
