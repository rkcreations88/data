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
import { Store } from "../../store/index.js";
import { TransactionWriteOperation } from "./transactional-store.js";
import { StringKeyof } from "../../../types/types.js";

// Helper function to apply write operations for rollback
export const applyOperations = (
    store: Store<any, any, any>,
    operations: TransactionWriteOperation<any>[]
) => {
    for (const operation of operations) {
        switch (operation.type) {
            case "insert": {
                const componentNames = ["id", ...Object.keys(operation.values)] as StringKeyof<any>[];
                const archetype = store.ensureArchetype(componentNames);
                archetype.insert(operation.values as never);
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
