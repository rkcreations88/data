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
import { ReadonlyTable, Table } from "./table.js";

/**
 * Comparison operators for declarative where clauses
 */
type ComparisonOperator = "==" | "!=" | "<" | ">" | ">=" | "<=";

const negatedOperators = {
    "==": "!=",
    "!=": "==",
    "<": ">=",
    ">": "<=",
    ">=": "<",
    "<=": ">",
} as const;

/**
 * Represents a comparison operation in a declarative where clause
 */
type ComparisonOperation<T> = {
    [P in ComparisonOperator]?: T;
};

/**
 * Represents a condition that can be either a direct value, comparison operation, or nested conditions
 */
type WhereCondition<T> = ComparisonOperation<T> | T;

const whereConditionToComparisonOperations = <T>(condition: WhereCondition<T>): ComparisonOperation<T> => {
    if (typeof condition === "object") {
        return condition as ComparisonOperation<T>;
    }
    return {
        "==": condition,
    } as ComparisonOperation<T>;
}

/**
 * Declarative where clause structure that allows for JSON-based filtering
 * Each key in the object represents a component field to filter on
 * The value can either be a direct value (equality check), a comparison operation, or nested conditions
 */
export type Filter<T extends object> = {
    [K in keyof T]?: WhereCondition<T[K]>;
};

export const selectRows = function* <C extends object>(table: Table<C>, where?: Filter<C>): Generator<number> {
    if (!where) {
        for (let row = 0; row < table.rows; row++) {
            yield row;
        }
    }
    else {
        const predicate = getRowPredicateFromFilter(where);
        for (let row = 0; row < table.rows; row++) {
            if (predicate(table, row)) {
                yield row;
            }
        }
    }
};

type RowPredicate<C extends object> = (table: ReadonlyTable<C>, row: number) => boolean;

const cacheByFilter = new WeakMap<Filter<any>, RowPredicate<any>>();
export const getRowPredicateFromFilter = <C extends object>(where?: Filter<C>): RowPredicate<C> => {
    if (!where) {
        return () => true;
    }
    let predicate = cacheByFilter.get(where);
    if (!predicate) {
        predicate = createRowPredicateFromFilterInternal(where);
        cacheByFilter.set(where, predicate);
    }
    return predicate;
}

const createRowPredicateFromFilterInternal = <C extends object>(where: Filter<C>): RowPredicate<C> => {
    let body =
        `    const { columns } = table;\n`;
    for (const [key, whereCondition] of Object.entries(where)) {
        body += `    const ${key} = columns.${key}.get(row);\n`;
        const comparisonOperations = whereConditionToComparisonOperations(whereCondition);
        body += `    if (${Object.entries(comparisonOperations).map(([operator, value]) => `${key} ${negatedOperators[operator as ComparisonOperator]} ${JSON.stringify(value)}`).join(" || ")}) { return false; }\n`;
    }
    body += `    return true;`;
    return new Function("table", "row", body) as RowPredicate<C>;
}

