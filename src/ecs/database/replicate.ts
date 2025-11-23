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
import { EntityInsertValues } from "../archetype/index.js";

export type ReplicationStop = () => void;

export interface ReplicateOptions<
    C extends Components,
    TC extends Components,
> {
    readonly onCreate?: (payload: {
        readonly source: Entity;
        readonly target: Entity;
        readonly components: EntityInsertValues<C>;
    }) => void;
    readonly onUpdate?: (payload: {
        readonly source: Entity;
        readonly target: Entity;
        readonly components: EntityUpdateValues<TC>;
    }) => void;
    readonly onDelete?: (payload: {
        readonly source: Entity;
        readonly target: Entity;
        readonly components: EntityUpdateValues<TC>;
    }) => void;
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
    const managedComponents = new Map<Entity, Set<StringKeyof<TC & CoreComponents>>>();
    const resourceNames = Object.keys(database.resources) as StringKeyof<R>[];
    const resourceNameSet = new Set<StringKeyof<R>>(resourceNames);
    const resourceEntities = new Map<Entity, StringKeyof<R>>();

    const synchronizeResource = (name: StringKeyof<R>) => {
        (target.resources as Record<string, unknown>)[name as string] = database.resources[name];
    };

    const ensureResourceEntities = () => {
        for (const name of resourceNames) {
            const archetype = database.ensureArchetype(
                ["id", name as unknown as StringKeyof<C & CoreComponents>],
            );
            const resourceId = archetype.columns.id.get(0);
            resourceEntities.set(resourceId, name);
            synchronizeResource(name);
        }
    };

    ensureResourceEntities();

    const missingTargetError = (sourceEntity: Entity) =>
        new Error(`Target entity missing for source entity ${String(sourceEntity)}`);

    const requireTargetState = (sourceEntity: Entity) => {
        const targetEntity = entityMap.get(sourceEntity);
        if (targetEntity === undefined) {
            throw missingTargetError(sourceEntity);
        }
        const targetValues = target.read(targetEntity);
        if (!targetValues) {
            throw missingTargetError(sourceEntity);
        }
        return { targetEntity, targetValues };
    };

    const deleteTargetEntity = (sourceEntity: Entity) => {
        const { targetEntity, targetValues } = requireTargetState(sourceEntity);
        const { id: _ignore, ...oldValues } = targetValues;
        target.delete(targetEntity);
        entityMap.delete(sourceEntity);
        managedComponents.delete(targetEntity);
        onDelete?.({
            source: sourceEntity,
            target: targetEntity,
            components: oldValues as EntityUpdateValues<TC>,
        });
    };

    const createTargetEntity = (sourceEntity: Entity, values: EntityReadValues<C>) => {
        const { id: _ignore, ...componentValues } = values;
        const entries = Object.entries(componentValues) as [StringKeyof<TC & CoreComponents>, unknown][];
        const componentNames = entries.map(([name]) => name);
        const insertValues = Object.fromEntries(entries) as EntityInsertValues<C>;
        const archetype = target.ensureArchetype(["id", ...componentNames] as StringKeyof<TC & CoreComponents>[]);
        const targetEntity = archetype.insert(insertValues as any);
        entityMap.set(sourceEntity, targetEntity);
        managedComponents.set(targetEntity, new Set(componentNames));
        onCreate?.({
            source: sourceEntity,
            target: targetEntity,
            components: insertValues,
        });
        return targetEntity;
    };

    const updateTargetEntity = (sourceEntity: Entity, values: EntityReadValues<C>) => {
        const { targetEntity, targetValues } = requireTargetState(sourceEntity);
        const managed = managedComponents.get(targetEntity);
        const nextManaged = new Set<StringKeyof<TC & CoreComponents>>();

        const { id: _ignore, ...componentValues } = values;
        const updates: Record<string, unknown> = {};
        let changed = false;

        for (const [name, value] of Object.entries(componentValues)) {
            const current = (targetValues as Record<string, unknown>)[name];
            nextManaged.add(name as StringKeyof<TC & CoreComponents>);
            if (!Object.is(current, value)) {
                updates[name] = value;
                changed = true;
            }
        }

        if (managed) {
            for (const name of managed) {
                if (!nextManaged.has(name)) {
                    updates[name as string] = undefined;
                    changed = true;
                }
            }
        }

        if (changed) {
            target.update(targetEntity, updates as EntityUpdateValues<TC>);
            managedComponents.set(targetEntity, nextManaged);
            onUpdate?.({
                source: sourceEntity,
                target: targetEntity,
                components: updates as EntityUpdateValues<TC>,
            });
        } else {
            managedComponents.set(targetEntity, nextManaged);
        }
    };

    const synchronizeEntity = (sourceEntity: Entity) => {
        const sourceValues = database.read(sourceEntity);
        if (!sourceValues) {
            deleteTargetEntity(sourceEntity);
            return;
        }
        if (!entityMap.has(sourceEntity)) {
            createTargetEntity(sourceEntity, sourceValues);
            return;
        }
        updateTargetEntity(sourceEntity, sourceValues);
    };

    const handleTransaction = (transaction: TransactionResult<C>) => {
        for (const component of transaction.changedComponents) {
            if (resourceNameSet.has(component as StringKeyof<R>)) {
                synchronizeResource(component as StringKeyof<R>);
            }
        }
        for (const [sourceEntity, change] of transaction.changedEntities) {
            if (resourceEntities.has(sourceEntity)) {
                continue;
            }
            if (change === null) {
                deleteTargetEntity(sourceEntity);
                continue;
            }
            synchronizeEntity(sourceEntity);
        }
    };

    const dispose = database.observe.transactions(handleTransaction);
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

