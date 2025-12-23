/*
 * REFERENCE FILE - OLD IMPLEMENTATION
 * 
 * This file contains the old Database.Schema.create implementation from commit 05dfb00
 * where the function accepted:
 * 1. A single schema descriptor as first argument
 * 2. An optional array of dependency schemas as second argument
 * 
 * This was later refactored to use rest parameters instead.
 */

import type { ComponentSchemas } from "../component-schemas.js";
import type { ResourceSchemas } from "../resource-schemas.js";
import type { ArchetypeComponents } from "../store/archetype-components.js";
import type { ActionDeclarations } from "../store/action-functions.js";
import type { FromSchemas } from "../../schema/index.js";
import type { IntersectTuple, StringKeyof } from "../../types/types.js";

export namespace OldDatabaseSchema {
  export type Schema<
    CS extends ComponentSchemas = any,
    RS extends ResourceSchemas = any,
    A extends ArchetypeComponents<StringKeyof<CS>> = any,
    TD extends ActionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A> = any
  > = {
    readonly components: CS;
    readonly resources: RS;
    readonly archetypes: A;
    readonly transactions: TD;
  };

  export namespace Schema {
    /**
     * Intersect multiple schemas into a single merged schema type
     */
    export type Intersect<T extends readonly Schema<any, any, any, any>[]> =
      Schema<
        {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<infer C, infer R, infer A, infer TD> ? C : never }>,
        {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, infer R, any, any> ? R : never }>,
        {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, any, infer A, any> ? A : never }>,
        {} & IntersectTuple<{ [K in keyof T]: T[K] extends Schema<any, any, any, infer TD> ? TD : never }>
      >

    /**
     * OLD SIGNATURE: Create a schema with optional dependencies array
     * 
     * @param schema - The schema descriptor containing components, resources, archetypes, and transactions
     * @param dependencies - Optional array of dependency schemas to merge with the primary schema
     * @returns Merged schema containing all properties from the input schema and dependencies
     * 
     * Example usage:
     * ```typescript
     * const baseSchema = Database.Schema.create({
     *   components: { position: { type: "number" } },
     *   resources: { time: { default: 0 } },
     *   archetypes: {},
     *   transactions: {}
     * });
     * 
     * const extendedSchema = Database.Schema.create(
     *   {
     *     components: { velocity: { type: "number" } },
     *     resources: { delta: { default: 0 } },
     *     archetypes: { Moving: ["position", "velocity"] },
     *     transactions: {}
     *   },
     *   [baseSchema] // Dependencies array
     * );
     * ```
     */
    export function create<
      const CS extends ComponentSchemas,
      const RS extends ResourceSchemas,
      const A extends ArchetypeComponents<StringKeyof<CS & Intersect<D>["components"]>>,
      const TD extends ActionDeclarations<FromSchemas<CS & Intersect<D>["components"]>, FromSchemas<RS & Intersect<D>["resources"]>, A>,
      const D extends readonly Schema<any, any, any, any>[],
    >(
      schema: {
        components: CS;
        resources: RS;
        archetypes: A;
        transactions: TD;
      },
      dependencies?: D
    ): Intersect<[Schema<CS, RS, A, TD>, ...D]> {
      return (dependencies ?? []).reduce((acc, curr) => {
        return {
          components: { ...acc.components, ...curr.components },
          resources: { ...acc.resources, ...curr.resources },
          archetypes: { ...acc.archetypes, ...curr.archetypes },
          transactions: { ...acc.transactions, ...curr.transactions },
        }
      },
        schema
      ) as any;
    }
  }
}

/*
 * KEY DIFFERENCES FROM CURRENT IMPLEMENTATION:
 * 
 * OLD (this file):
 * - Second parameter is an ARRAY of dependencies: `dependencies?: D`
 * - Signature: create(schema, [dep1, dep2, dep3])
 * - Uses reduce to merge dependencies with schema
 * 
 * CURRENT (create-plugin.ts):
 * - Uses REST PARAMETERS: ...args
 * - Signature: create(schema1, schema2, schema3, ...)
 * - Multiple overloads for 1-4 arguments
 * - More flexible but more complex type definitions
 * 
 * MIGRATION PATH:
 * If you want to convert old code to new:
 *   OLD: Database.Schema.create(schema, [dep1, dep2])
 *   NEW: Database.Plugin.create(dep1, dep2, schema)
 * 
 * Note: The order is reversed - dependencies come first, then the main schema
 */

