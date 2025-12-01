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

import { Database } from "./database.js";
import { Components } from "../store/components.js";
import { ResourceComponents } from "../store/resource-components.js";
import { ArchetypeComponents } from "../store/archetype-components.js";
import { Store } from "../store/index.js";
import { StringKeyof } from "../../types/types.js";
import { Entity } from "../entity.js";
import { RequiredComponents } from "../required-components.js";
import { TransactionResult } from "./transactional-store/index.js";

export type ReplicationStop = () => void;

export const replicate = <
    const C extends Components,
    const R extends ResourceComponents,
    const A extends ArchetypeComponents<StringKeyof<C>>,
    const TC extends Components = C,
    const TR extends ResourceComponents = R,
>(
    database: Database<C, R, A, any>,
    target: Store<TC, TR, any>,
    callback?: (operation: "create" | "update" | "delete", source: Entity, target: Entity) => void,
): ReplicationStop => {

    const entityMap = new Map<Entity, Entity>();
    const archetypeMap = new Map<number, ReturnType<typeof target.ensureArchetype>>();

    function getTargetArchetype(sourceArchetype: { readonly id: number; readonly components: ReadonlySet<string> }) {
        let targetArchetype = archetypeMap.get(sourceArchetype.id);
        if (!targetArchetype) {
            targetArchetype = target.ensureArchetype(sourceArchetype.components as unknown as ReadonlySet<StringKeyof<TC & RequiredComponents>>);
            archetypeMap.set(sourceArchetype.id, targetArchetype);
        }
        return targetArchetype;
    };

    // Initialize the resource entity map with the resources from the database
    // And copy the source resources to the target store
    for (const name of Object.keys(database.resources) as StringKeyof<R>[]) {
        const sourceArchetype = database.ensureArchetype(["id", name as unknown as StringKeyof<C & RequiredComponents>]);
        const sourceEntity = sourceArchetype.columns.id.get(0);
        const targetArchetype = getTargetArchetype(sourceArchetype);
        const targetEntity = targetArchetype.columns.id.get(0);
        entityMap.set(sourceEntity, targetEntity);
        (target.resources as Record<string, unknown>)[name as string] = database.resources[name];
        callback?.("update", sourceEntity, targetEntity);
    }

    return database.observe.transactions((transaction: TransactionResult<C>) => {
        for (const [sourceEntity, change] of transaction.changedEntities) {
            const existingTargetEntity = entityMap.get(sourceEntity);
            if (change === null) {
                // delete
                target.delete(existingTargetEntity!);
                entityMap.delete(sourceEntity);
                callback?.("delete", sourceEntity, existingTargetEntity!);
            }
            else if (existingTargetEntity === undefined) {
                // create
                const sourceLocation = database.locate(sourceEntity)!;
                const targetArchetype = getTargetArchetype(sourceLocation.archetype);
                const newTargetEntity = targetArchetype.insert(change as any);
                entityMap.set(sourceEntity, newTargetEntity);
                callback?.("create", sourceEntity, newTargetEntity);
            }
            else {
                // update
                target.update(existingTargetEntity, change as any);
                callback?.("update", sourceEntity, existingTargetEntity);
            }
        }
    });
};

