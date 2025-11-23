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
import { CoreComponents } from "../core-components.js";
import { EntityReadValues, EntityUpdateValues } from "../store/core/index.js";
import { TransactionResult } from "./transactional-store/index.js";

export type ReplicationStop = () => void;

export interface ReplicateOptions<
    C extends Components,
    TC extends Components,
> {
    readonly onCreate?: (source: Entity, target: Entity) => void;
    readonly onUpdate?: (source: Entity, target: Entity) => void;
    readonly onDelete?: (source: Entity, target: Entity) => void;
}

export const replicate = <
    const C extends Components,
    const R extends ResourceComponents,
    const A extends ArchetypeComponents<StringKeyof<C>>,
    const TC extends Components = C,
    const TR extends ResourceComponents = R,
>(
    database: Database<C, R, A, any>,
    target: Store<TC, TR, any>,
    options: ReplicateOptions<C, TC> = {},
): ReplicationStop => {
    const { onCreate, onUpdate, onDelete } = options;

    const entityMap = new Map<Entity, Entity>();
    const componentValues = new Map<Entity, Record<string, unknown>>();
    const resourceNames = Object.keys(database.resources) as StringKeyof<R>[];
    const resourceNameSet = new Set<StringKeyof<R>>(resourceNames);
    const resourceEntityMap = new Map<Entity, { target: Entity; name: StringKeyof<R> }>();
    const archetypeMap = new Map<number, ReturnType<typeof target.ensureArchetype>>();

    for (const name of resourceNames) {
        const sourceArchetype = database.ensureArchetype(["id", name as unknown as StringKeyof<C & CoreComponents>]);
        const sourceEntity = sourceArchetype.columns.id.get(0);
        const targetArchetype = target.ensureArchetype(sourceArchetype.components as ReadonlySet<StringKeyof<TC & CoreComponents>>);
        const targetEntity = targetArchetype.columns.id.get(0);
        resourceEntityMap.set(sourceEntity, { target: targetEntity, name });
        (target.resources as Record<string, unknown>)[name as string] = database.resources[name];
    }

    const getTargetArchetype = (sourceArchetype: { readonly id: number; readonly components: ReadonlySet<string> }) => {
        let targetArchetype = archetypeMap.get(sourceArchetype.id);
        if (!targetArchetype) {
            targetArchetype = target.ensureArchetype(sourceArchetype.components as unknown as ReadonlySet<StringKeyof<TC & CoreComponents>>);
            archetypeMap.set(sourceArchetype.id, targetArchetype);
        }
        return targetArchetype;
    };

    const dispose = database.observe.transactions((transaction: TransactionResult<C>) => {
        for (const component of transaction.changedComponents) {
            if (resourceNameSet.has(component as StringKeyof<R>)) {
                const name = component as StringKeyof<R>;
                (target.resources as Record<string, unknown>)[name as string] = database.resources[name];
            }
        }
        for (const [sourceEntity, change] of transaction.changedEntities) {
            const resourceInfo = resourceEntityMap.get(sourceEntity);
            if (resourceInfo) {
                (target.resources as Record<string, unknown>)[resourceInfo.name as string] = database.resources[resourceInfo.name];
                continue;
            }

            if (change === null) {
                const targetEntity = entityMap.get(sourceEntity)!;
                target.delete(targetEntity);
                entityMap.delete(sourceEntity);
                componentValues.delete(sourceEntity);
                onDelete?.(sourceEntity, targetEntity);
                continue;
            }
            const sourceState = database.read(sourceEntity);
            if (!sourceState) {
                continue;
            }
            const sourceComponents = { ...(sourceState as EntityReadValues<C> & Record<string, unknown>) };
            const { id: _ignore, ...rest } = sourceComponents;
            const nextComponents = rest as Record<string, unknown>;
            const sourceLocation = database.locate(sourceEntity);
            if (!sourceLocation) {
                continue;
            }
            const sourceArchetype = sourceLocation.archetype;

            if (!entityMap.has(sourceEntity)) {
                const targetArchetype = getTargetArchetype(sourceArchetype);
                const targetEntity = targetArchetype.insert(nextComponents as any);
                entityMap.set(sourceEntity, targetEntity);
                componentValues.set(sourceEntity, { ...nextComponents });
                onCreate?.(sourceEntity, targetEntity);
                continue;
            }

            const targetEntity = entityMap.get(sourceEntity)!;
            const previousComponents = componentValues.get(sourceEntity)!;
            const updates: Record<string, unknown | undefined> = {};

            for (const key in previousComponents) {
                if (!Object.prototype.hasOwnProperty.call(previousComponents, key)) {
                    continue;
                }
                if (!Object.prototype.hasOwnProperty.call(nextComponents, key)) {
                    updates[key] = undefined;
                }
            }

            for (const key in nextComponents) {
                if (!Object.prototype.hasOwnProperty.call(nextComponents, key)) {
                    continue;
                }
                const value = nextComponents[key];
                if (!Object.prototype.hasOwnProperty.call(previousComponents, key) || !Object.is(previousComponents[key], value)) {
                    updates[key] = value;
                }
            }

            if (Object.keys(updates).length > 0) {
                target.update(targetEntity, updates as EntityUpdateValues<TC>);
                componentValues.set(sourceEntity, { ...nextComponents });
            }

            onUpdate?.(sourceEntity, targetEntity);
        }
    });
    let stopped = false;

    const stop = () => {
        if (stopped) {
            return;
        }
        stopped = true;
        dispose();
    };

    return stop;
};

