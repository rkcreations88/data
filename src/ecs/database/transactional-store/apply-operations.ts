import { ResourceComponents } from "../../store/resource-components.js";
import { Store } from "../../store/index.js";
import { Transaction, TransactionWriteOperation } from "./transactional-store.js";
import { StringKeyof } from "../../../types/types.js";
import { Components } from "../../store/components.js";
import { ArchetypeComponents } from "../../store/archetype-components.js";

// Helper function to apply write operations for rollback
export const applyOperations = (
    store: Transaction<any, any, any> | Store<any, any, any>,
    operations: TransactionWriteOperation<any>[]
) => {
    for (const operation of operations) {
        switch (operation.type) {
            case "insert": {
                const componentNames = ["id", ...Object.keys(operation.values)] as StringKeyof<any>[];
                const archetype = store.ensureArchetype(componentNames);
                archetype.insert(operation.values as any);
                break;
            }
            case "update":
                store.update(operation.entity, operation.values);
                break;
            case "delete":
                store.delete(operation.entity);
                break;
        }
    }
}
