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

import {
  Data,
  equals,
  normalize,
} from "../../index.js";
import {
  FromSchema,
  Schema,
} from "../../schema/index.js";
import {
  ManagedArray,
  createManagedArray,
} from "../../cache/managed-array.js";
import {
  MemoryAllocator,
  createSimpleMemoryAllocator,
} from "../../cache/memory-allocator.js";
import {
  CoreArchetype,
  CoreECS,
  Table,
  Entity,
  EntityValues,
  CoreComponents,
  ECSJSON,
  CoreResources,
} from "./core-ecs-types.js";
import { U32Schema } from "../../schema/u32.js";
import { isSchema } from "../../schema/schema.js";

//  This is a sentinel value used to indicate a component should be deleted.
export const DELETE: unknown = "_@_DELETE_@_";

type CoreTableImpl<C extends CoreComponents> = Omit<Table<C>, "columns"> & {
  columns: { [K in keyof C]: ManagedArray<C[K]> };
};

type CoreArchetypeImpl<C extends CoreComponents> = CoreArchetype<C> &
  CoreTableImpl<C> & {
    id: number;
    rows: number;
    components: (keyof C)[];
    addComponent: Map<keyof C, CoreArchetypeImpl<C>>;
    removeComponent: Map<keyof C, CoreArchetypeImpl<C>>;
    createRow: (values?: C) => number;
    deleteRow: (row: number) => void;
    readRow: (row: number) => C;
  };

export function createCoreECS<
  C extends CoreComponents,
  R extends CoreResources,
>(
  options: {
    data?: ECSJSON;
    allocator?: MemoryAllocator;
    privacyOptions?: {
        strictlyNecessary?: boolean;
        functional?: boolean;
        performance?: boolean;
        advertising?: boolean
    }
  } = {}
): CoreECS<CoreComponents, {}> {
  type Component = keyof C;
  const ELEMENTS_PER_RECORD = 2;
  const DELETED_ARCHETYPE = 0xff;

  const componentSchemas = {
    id: U32Schema,
  } as { [K in keyof C]: Schema };
  const getSchema = (name: Component) => {
    const schema = componentSchemas[name];
    if (!schema) {
      throw new Error(`Component "${String(name)}" not found`);
    }
    return schema;
  };

  const resources = {} as R;

  let recordCount = 0;
  let recordCapacity = 1024;
  let firstDeletedId = 0;
  let records = new Uint32Array(recordCapacity * ELEMENTS_PER_RECORD);

  const { allocator = createSimpleMemoryAllocator() } = options;
  //  What if we remove internal components?
  //  id, name, component, schema?
  //  We DO need id as a component since it gets it's own column.
  //  But do we need to track components internally?
  //  [x] This is safely derived as needed.
  const archetypeLookup: Record<string, CoreArchetypeImpl<C>> = {};
  //  [ ] the order of these is relevant for serialization currently.
  const archetables: CoreArchetypeImpl<C>[] = [];
  //  [x] This is created as archetypes are requested.
  const componentsToArchetypes = new Map<keyof C, Set<CoreArchetypeImpl<C>>>();

  /**
   * Returns the component with the least number of archetypes containing it.
   */
  const getMostExclusiveComponent = (components: Component[]): Component => {
    if (components.length === 0) {
      throw new Error("Cannot call with zero components");
    }
    let mostExclusive = components[0];
    let size = Number.POSITIVE_INFINITY;
    for (const component of components) {
      const archetypes = getComponentsToArchetypes(component)!;
      if (archetypes.size < size) {
        size = archetypes.size;
        mostExclusive = component;
      }
    }
    return mostExclusive;
  };

  const getAdjacentArchetype = (
    archetable: CoreArchetypeImpl<C>,
    component: Component,
    addOrRemove: "addComponent" | "removeComponent"
  ): CoreArchetypeImpl<C> => {
    let newTable = archetable[addOrRemove].get(component);
    if (!newTable) {
      const add = addOrRemove === "addComponent";
      const newComponents = (
        add
          ? [...archetable.components, component].sort()
          : archetable.components.filter((c) => c !== component)
      ) as Component[];
      newTable = getArchetype(...newComponents);
      //  add the edge lookup to the new table
      archetable[addOrRemove].set(component, newTable);
      newTable[
        addOrRemove === "addComponent" ? "removeComponent" : "addComponent"
      ].set(component, archetable);
    }
    return newTable;
  };

  const getComponentValue = <Name extends Component>(
    id: Entity,
    component: Name
  ): C[Name] | undefined => {
    const index = id * ELEMENTS_PER_RECORD;
    const archetable = archetables[records[index + 0]];
    const row = records[index + 1];
    const array = archetable.columns[component];
    if (array === undefined) {
      return undefined;
    }
    return array.get(row) as C[Name];
  };

  const setComponentValue = <Name extends Component>(
    id: Entity,
    component: Name,
    value: C[Name]
  ): void => {
    if (value === undefined) {
      value = DELETE as any;
    }
    const index = id * ELEMENTS_PER_RECORD;
    const archetable = archetables[records[index + 0]];
    const currentRow = records[index + 1];
    const array = archetable.columns[component];
    if (value !== DELETE) {
      if (array === undefined) {
        //  add component
        const newTable = getAdjacentArchetype(
          archetable,
          component,
          "addComponent"
        );
        const newRow = newTable.createRow();
        //  manually move values over
        for (const name of archetable.components as Component[]) {
          const targetColumn = archetable.columns[name];
          if (targetColumn !== undefined) {
            newTable.columns[name].set(newRow, targetColumn.get(currentRow));
          }
        }
        //  set the new component value
        newTable.columns[component].set(newRow, value);

        archetable.deleteRow(currentRow);
        records[index + 0] = newTable.id;
        records[index + 1] = newRow;
      } else {
        //  updating value
        array.set(currentRow, value);
      }
    } else if (array !== undefined) {
      //  remove component
      const newTable = getAdjacentArchetype(
        archetable,
        component,
        "removeComponent"
      );
      const newRow = newTable.createRow();
      //  manually move values over, except for the removed one
      for (const name of archetable.components as Component[]) {
        if (name !== component) {
          newTable.columns[name].set(
            newRow,
            archetable.columns[name].get(currentRow)
          );
        }
      }
      archetable.deleteRow(currentRow);
      records[index + 0] = newTable.id;
      records[index + 1] = newRow;
    }
  };

  const getArchetype = (...components: Component[]): CoreArchetypeImpl<C> => {
    components.sort();
    const ids = new Set(components);
    if (!ids.has("id")) {
      ids.add("id");
      components.unshift("id");
    }
    const key = components.join(",");
    let archetype: CoreArchetypeImpl<C> = archetypeLookup[key];
    if (!archetype) {
      const columns = Object.fromEntries(
        components.map((name) => [
          name,
          createManagedArray(getSchema(name), allocator),
        ])
      ) as CoreTableImpl<C>["columns"];

      const id = archetables.length;
      archetype =
        archetables[id] =
        archetypeLookup[key] =
        {
          components,
          id,
          rows: 0,
          columns,
          addComponent: new Map(),
          removeComponent: new Map(),
          readRow: (row: number) => {
            const values: any = {};
            for (const name of components) {
              values[name] = columns[name].get(row);
            }
            return values;
          },
          createRow: (values: C | undefined) => {
            const newRow = archetype.rows++;
            for (const name of components) {
              const column = columns[name] as ManagedArray<any>;
              column.ensureCapacity(archetype.rows);
              if (values) {
                const value = values[name];
                if (value === undefined) {
                  throw new Error(
                    `Missing value for column "${String(name)}"`
                  );
                }
                column.set(newRow, value);
              }
            }
            return newRow;
          },
          deleteRow: (row: number) => {
            archetype.rows--;
            // the main ecs records row pointer is updated to the new row
            if (archetype.rows > 0) {
              const movedRowId = columns.id.native![archetype.rows];
              const movedRowIndex = movedRowId * ELEMENTS_PER_RECORD;
              records[movedRowIndex + 1] = row;
            }
            //  then we remove each columns row, moving the last to replace it.
            for (const name of components) {
              const column = columns[name];
              if (column !== undefined) {
                if (archetype.rows > 0) {
                  // the last row (at size) is moved to replace the deleted row
                  column.move(archetype.rows, row);
                }
              }
            }
          },
        };
      for (const name of components) {
        getComponentsToArchetypes(name).add(archetype);
      }
    }
    return archetype;
  };

  const getEntityArchetype = (id: Entity): CoreArchetype => {
    return archetables[records[id * ELEMENTS_PER_RECORD]] as any;
  };

  const getComponentsToArchetypes = (
    name: keyof C
  ): Set<CoreArchetypeImpl<C>> => {
    let set = componentsToArchetypes.get(name);
    if (!set) {
      componentsToArchetypes.set(name, (set = new Set()));
    }
    return set;
  };

  const withComponents = <
    S extends { [K: string]: Schema },
    T = { [K in keyof S]: FromSchema<S[K]> },
  >(
    components: S
  ) => {
    Object.entries(components).forEach(([name, newSchema]) => {
      const oldSchema = componentSchemas[name as keyof C];
      //  it's OK for a component to be defined more than once
      //  so long as the schema is the same.
      if (oldSchema && !equals(normalize(oldSchema), normalize(newSchema))) {
        console.warn(`Component "${name}" schema changed from ${JSON.stringify(oldSchema)} to ${JSON.stringify(newSchema)}`);
      }
      componentSchemas[name as keyof C] = newSchema;
    });
    return ecs as CoreECS<CoreComponents & T>;
  };

  const withResources = <T extends { readonly [K: string]: Data }>(
    newResources: T
  ): any => {
    Object.entries(newResources).forEach(([name, valueOrSchema]) => {
      //  register the resource as a component.
      const schema: Schema = isSchema(valueOrSchema) ? valueOrSchema : { default: valueOrSchema };
      withComponents({ [name]: schema });
      const value = schema.default;
      const archetype = getArchetype("id", name as Component);
      //  resource row *may* already exist if loaded from disk.
      const entityId = archetype.rows
        ? archetype.columns.id.get(archetype.rows)
        : createEntity(archetype, { [name]: value } as any);
      const column = (archetype.columns as any)[name] as ManagedArray<Data>;
      Object.defineProperty(resources, name, {
        get: () => column.get(0),
        set: (newValue) => {
          updateEntity(entityId, { [name]: newValue });
        },
      });
    });
    return ecs as any;
  };

  function getTables(): CoreTableImpl<C>[];
  function getTables(
    archetype: CoreArchetype<C>,
    options: { mode: "read" | "write"; exact?: boolean }
  ): CoreTableImpl<C>[];
  function getTables(
    archetype?: CoreArchetype<C>,
    options?: { mode: "read" | "write"; exact?: boolean }
  ): CoreTableImpl<C>[] {
    if (!archetype) {
      return archetables.filter((a) => a.rows > 0);
    }
    if (options?.exact) {
      return [archetype as CoreArchetypeImpl<C>];
    }
    const components = archetype.components as (keyof C)[];
    const tables: CoreTableImpl<C>[] = [];
    const baseSet = getComponentsToArchetypes(
      getMostExclusiveComponent(components)
    )!;
    for (const archetable of baseSet) {
      if (archetable.rows === 0) {
        continue;
      }
      let hasAll = true;
      for (const component of components) {
        if (!archetable.columns[component]) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) {
        tables.push(archetable);
      }
    }
    return tables;
  }
  const countEntities = (archetype: CoreArchetype) => {
    let count = 0;
    for (const table of getTables(archetype, { mode: "read" })) {
      count += table.rows;
    }
    return count;
  };

  const selectEntities = (archetype: CoreArchetype) => {
    const tables = getTables(archetype, { mode: "read" });
    const entities: number[] = [];
    let offset = 0;
    for (const table of tables) {
      // this native array will probably be longer than the actual size.
      const size = table.rows;
      const nativeArray = table.columns.id.native!;
      // copy from 0 .. size to entities
      for (let i = 0; i < size; i++) {
        entities[offset++] = nativeArray[i];
      }
    }
    return entities;
  };

  const getEntityValues = (
    id: Entity
  ): EntityValues<CoreComponents> | undefined => {
    const index = id * ELEMENTS_PER_RECORD;
    const archetypeId = records[index + 0];
    if (archetypeId === undefined || archetypeId === DELETED_ARCHETYPE) {
      return undefined;
    }
    const archetable = archetables[records[index + 0]];
    const row = records[index + 1];
    const values: any = {};
    for (const name of archetable.components) {
      values[name] = archetable.columns[name].get(row);
    }
    return values;
  };

  const updateEntity = (
    id: Entity,
    values: { [K in keyof CoreComponents]?: CoreComponents[K] | undefined }
  ) => {
    for (const name in values) {
      if (name === "id") {
        throw new Error("Cannot update id");
      }
      let value = values[name as keyof CoreComponents] as any;
      if (value === undefined) {
        value = DELETE;
      }
      setComponentValue(id, name as keyof C, value);
    }
  };

  function ensureRecordCapacity(capacity: number) {
    if (recordCapacity < capacity) {
      recordCapacity = Math.max(capacity, recordCapacity * 2);
      const newRecords = new Uint32Array(recordCapacity * ELEMENTS_PER_RECORD);
      newRecords.set(records);
      records = newRecords;
    }
  }

  const createEntity = <A extends CoreComponents>(
    _archetype?: CoreArchetype<A>,
    values?: Omit<A, "id">
  ) => {
    const archetype = (_archetype as CoreArchetypeImpl<C>) ?? emptyArchetype;
    let id: number;
    if (firstDeletedId > 0 && recordCount > 0) {
      id = firstDeletedId;
      const index = id * ELEMENTS_PER_RECORD;
      //  point to the next deleted id
      firstDeletedId = records[index + 1];
    } else {
      //  create new entity record
      ensureRecordCapacity(recordCount + 1);
      id = recordCount++;
    }
    //  now put it directly into the archetype.
    values = (values ? { ...values, id } : { id }) as any;
    const row = archetype.createRow(values as any);

    //  now add the records entry
    const index = id * ELEMENTS_PER_RECORD;

    records[index + 0] = archetype.id;
    records[index + 1] = row;

    return id;
  };

  const createBatch = <T extends CoreComponents>(
    archetype: CoreArchetype<T>,
    count: number,
  ) => {
    const table = getTables(archetype as any, { mode: "write", exact: true })[0] as unknown as CoreArchetypeImpl<T>;
    ensureRecordCapacity(recordCount + count);
    for (const name in table.columns) {
      const column = table.columns[name];
      column.ensureCapacity(table.rows + count);
    }
    const ids = table.columns.id.native!;
    //  we are only going to rapidly create main record entries *and* the archetype id values.
    let created = 0;
    //  first recycle any deleted ids
    while (created < count && firstDeletedId > 0 && recordCount > 0) {
      const id = firstDeletedId;
      const index = id * ELEMENTS_PER_RECORD;
      //  point to the next deleted id
      firstDeletedId = records[index + 1];
      const row = table.rows + created++;
      records[index + 0] = table.id;
      records[index + 1] = row;
      ids[row] = id;
    }
    recordCount += created;
    //  then quickly create the rest
    for (; created < count; created++) {
      const id = recordCount++;
      const row = table.rows + created;
      records[id * ELEMENTS_PER_RECORD + 0] = table.id;
      records[id * ELEMENTS_PER_RECORD + 1] = row;
      ids[row] = id;
    }

    table.rows += count;

    return table as Table<T>;
  };

  const deleteEntity = (id: Entity) => {
    const index = id * ELEMENTS_PER_RECORD;
    const archetype = archetables[records[index + 0]];
    const row = records[index + 1];
    archetype.deleteRow(row);
    const nextDeletedId = firstDeletedId;
    firstDeletedId = id;
    records[index + 0] = DELETED_ARCHETYPE;
    records[index + 1] = nextDeletedId;
  };

  //  this first archetype in the table must be the empty entity archetype which contains only the id.
  const emptyArchetype = getArchetype("id");

  //  1 = initial
  //  2 = simplified format
  //  3 = Numbers default to Float64Array instead of Float32Array
  //  4 = bug fix for createRow not ensuring capacity
  const SERIALIZATION_VERSION = 4;

  /**
   * Checks if a component should be included for serialization
   * @param component - The component to check
   * @param options - The options to use
   * @returns Whether the component should be included
   */
  const shouldIncludeComponentForSerialization = (component: string, options?: {
    strictlyNecessary?: boolean;
    functional?: boolean;
    performance?: boolean;
    advertising?: boolean
  }): boolean => {
      const schema = componentSchemas[component as keyof C];
      // if the component has no privacy attribute, it is considered as necessary.
      // this is to maintain backwards compatibility with existing schemas
      if (!schema?.privacy) {
        return true;
      }
      // Check the privacy attribute
      switch (schema.privacy) {
        case 'functional':
          return options?.functional ?? false;
        case 'performance':
          return options?.performance ?? false;
        case 'advertising':
          return options?.advertising ?? false;
        default: // strictlyNecessary is the default and is always included
          return true;
    }
  }

  /**
   * Filters the components for privacy
   * @param options - The options to use
   * @returns The filtered components
   */
  const filterComponentsForPrivacyGlobal = (options?: {
    strictlyNecessary?: boolean;
    functional?: boolean;
    performance?: boolean;
    advertising?: boolean
  }): Record<string, Schema> => {
    // filter the components for privacy
    const filteredComponents = Object.fromEntries(
        Object.entries(componentSchemas).filter(([schemaName, oldSchema]) => shouldIncludeComponentForSerialization(schemaName, options))
    ) as Record<string, Schema>;
    return filteredComponents;
  }

  /**
   * Filters the components for privacy
   * @param componentSchemas - The component schemas to filter
   * @param options - The options to use
   * @returns The filtered components
   */
  const filterComponentsForPrivacy = (componentSchemas: Record<string, Schema>,options?: {
    strictlyNecessary?: boolean;
    functional?: boolean;
    performance?: boolean;
    advertising?: boolean
  }): Record<string, Schema> => {
    // filter the components for privacy
    const filteredComponents = Object.fromEntries(
        Object.entries(componentSchemas).map(entry => {
          const [schemaName, oldSchema] = entry;
          const updatedSchema = { ...oldSchema };
          if (!shouldIncludeComponentForSerialization(schemaName, options)) {
          // Apply default values if they don't exist
          if (updatedSchema.default !== undefined) {
            switch(updatedSchema.type) {
              case 'number':
              case 'integer':
                updatedSchema.default = 0;
                break;
              case 'string':
                updatedSchema.default = '';
                break;
              case 'boolean':
                updatedSchema.default = false;
                break;
              case 'object':
                updatedSchema.default = {};
                break;
              case 'array':
                updatedSchema.default = [];
                break;
              case 'typed-buffer':
                updatedSchema.default = new Uint8Array();
                break;
              case 'blob':
                updatedSchema.default = null;
                break;
              default:
                // For schemas with const, enum, or other constraints
                if (updatedSchema.const !== undefined) {
                  updatedSchema.default = updatedSchema.const;
                } else if (updatedSchema.enum && updatedSchema.enum.length > 0) {
                  updatedSchema.default = updatedSchema.enum[0];
                } else {
                  updatedSchema.default = undefined;
                }
                break;
            }
          }
        }
          return [schemaName, updatedSchema];
        })
    ) as Record<string, Schema>;
    return filteredComponents;
  }

        // .filter(([schemaName, oldSchema]) => !shouldIncludeComponentForSerialization(schemaName, options))
        // .map(([schemaName, oldSchema]) => {
          // const updatedSchema = { ... oldSchema };

          // if (updatedSchema.default === undefined) {
          //   switch(updatedSchema.type) {
          //     case 'number':
          //     case 'integer':
          //       updatedSchema.default = 0;
          //       break;
          //     case 'string':
          //       updatedSchema.default = '';
          //       break;
          //     case 'boolean':
          //       updatedSchema.default = false;
          //       break;
          //     case 'object':
          //       updatedSchema.default = {};
          //       break;
          //     case 'array':
          //       updatedSchema.default = [];
          //       break;
          //     case 'typed-buffer':
          //       updatedSchema.default = new Uint8Array();
          //       break;
          //     case 'blob':
          //       updatedSchema.default = null;
          //       break;
          //     default:
          //       // For schemas with const, enum, or other constraints
          //       if (updatedSchema.const !== undefined) {
          //         updatedSchema.default = updatedSchema.const;
          //       } else if (updatedSchema.enum && updatedSchema.enum.length > 0) {
          //         updatedSchema.default = updatedSchema.enum[0];
          //       }
          //       break;
          //   }
          // }

  //         return [schemaName, updatedSchema];
  //       })
  //   ) as Record<string, Schema>;
  //   return filteredComponents;
  // }

  /**
   * Filters the tables for privacy
   * @param filteredComponents - The filtered components
   * @returns The filtered tables
   */
  const filterTablesForPrivacy = (filteredComponents: Record<string, Schema>) => {
    // filter the tables for privacy based on the filtered components.
    const result = archetables.map((table, index) => {
      if (index !== table.id) {
        throw new Error(`Table id mismatch: ${index} !== ${table.id}`);
      }

      const {rows, columns} = table;
      const filteredColumns = Object.fromEntries(
          Object.entries(columns)
              .filter(([name, schema]) => Object.keys(filteredComponents).includes(name))
              .map(([name, column]) => {
                // Use the filtered component's default value if available and column data is empty/undefined
                let value = column.toJSON(rows, name !== "id");
                // Get the filtered component schema with default values
                const filteredComponentSchema = filteredComponents[name];
                // If the column has no data and the filtered component has a default, use the default
                if ((value === undefined || value === null || (Array.isArray(value) && value.length === 0))
                    && filteredComponentSchema?.default !== undefined) {
                  // Create array filled with default values for the number of rows
                  if (rows > 0) {
                    value = new Array(rows).fill(filteredComponentSchema.default);
                  } else {
                    value = [];
                  }
                }

                return [name, value];
              })
      );

      return {
        table: {
          rows,
          columns: filteredColumns,
        },
        isValidTable: Object.keys(filteredColumns).length >= 1,
      };
    }).filter(tableInfo => tableInfo.isValidTable)
        .map(tableInfo => tableInfo.table);

    return result;
  }

   const filterTableForPrivacy = (filteredComponents: Record<string, Schema>, table: any) => {
     // filter the tables for privacy based on the filtered components.
     const {rows, columns} = table;
     const filteredColumns = Object.fromEntries(
         Object.entries(columns)
             .filter(([name, data]) => Object.keys(filteredComponents).includes(name))
             .map(([name, data]) => {
               // For JSON data, we don't need to call toJSON since it's already serialized
               let value = data;
               // Get the filtered component schema with default values
               const filteredComponentSchema = filteredComponents[name];
               // If the column has no data and the filtered component has a default, use the default
               if ((value === undefined || value === null || (Array.isArray(value) && value.length === 0))
                   && filteredComponentSchema?.default !== undefined) {
                 // Create array filled with default values for the number of rows
                 if (rows > 0) {
                   value = new Array(rows).fill(filteredComponentSchema.default);
                 } else {
                   value = [];
                 }
               }

               return [name, value];
             })
     );

     return {
       rows,
       columns: filteredColumns,
     };
   }

  /**
   * Serializes the ECS to JSON
   * @param options - The options to use
   * @returns The JSON
   */
  const toJSON = (options?: {
    strictlyNecessary?: boolean;
    functional?: boolean;
    performance?: boolean;
    advertising?: boolean;
  }) => {

    // get the filtered components based on its own privacy attribute and the provided privacy options
    const filteredComponents = filterComponentsForPrivacy(componentSchemas, options);
    // filter the tables for privacy based on the filtered components.
    const filteredTables = filterTablesForPrivacy(filteredComponents);

    return {
      ecs: true,
      version: SERIALIZATION_VERSION,
      components: filteredComponents,
      entities: [...records.slice(0, recordCount * 2)],
      tables: filteredTables,
    } as const;
  };

  /**
   * Deserializes the ECS from JSON
   * @param json - The JSON to deserialize
   * @returns Whether the deserialization was successful
   */
  const fromJSON = (json: any) => {
    const { ecs, version, entities, tables } = json;
    if (!ecs) {
      throw new Error("Not an ECS");
    }
    if (version !== SERIALIZATION_VERSION) {
      return false;
    }

    // filter the components for privacy
    const filteredComponents = filterComponentsForPrivacy(json.components as Record<string, Schema>, options.privacyOptions);
    recordCount = entities.length / 2;
    ensureRecordCapacity(recordCount);
    records.set(entities);
    Object.assign(componentSchemas, filteredComponents);

    // create a set of the filtered components keys
    // const filteredComponentSchemaSet = new Set(Object.keys(filteredComponents));

    for (let i = 0; i < tables.length; i++) {
      const persistedTable = tables[i];
      const { rows, columns } = filterTableForPrivacy(filteredComponents, persistedTable);
      const tableComponents = Object.keys(columns) as Component[];
      // filter the table components to remove any components that are not in the filtered components set
      // const components = tableComponents.filter(component => filteredComponentSchemaSet.has(component as string));
      // if (components.length < 2) {
      //   continue;
      // }
      const archetype = getArchetype(...tableComponents);
      const [archetable] = getTables(archetype, {
        mode: "write",
        exact: true,
      }) as CoreArchetypeImpl<C>[];
      archetable.rows = rows;
      for (const [name, columnData] of Object.entries(columns)) {
        const column = (archetable.columns as any)[name];
        column.fromJSON(columnData, rows);
      }
    }
    return true;
  };

  const ecs: CoreECS = {
    components: componentSchemas,
    resources,
    getComponentValue,
    setComponentValue,
    countEntities,
    selectEntities,
    getTables,
    getArchetype: getArchetype as any,
    getEntityArchetype,
    withComponents,
    withResources,
    getEntityValues,
    createBatch,
    createEntity,
    updateEntity,
    deleteEntity,
    toJSON,
  };

  if (options.data) {
    fromJSON(options.data);
  }

  return ecs;
}
