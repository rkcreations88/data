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

import { EntityValues, CoreComponents } from "../core-ecs/core-ecs-types.js";
import { WhereClause } from "./ecs-types.js";

/**
 * Converts a declarative where clause to a predicate function
 */
export function whereClauseToPredicate<T extends CoreComponents>(whereClause: WhereClause<T>): (entity: EntityValues<T>) => boolean {
  // Helper function to get nested value
  function getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => current && current[key], obj);
  }

  // Helper function to check conditions recursively
  function checkCondition(value: any, condition: any): boolean {
    // If condition is a direct value, check for equality
    if (typeof condition !== 'object' || condition === null) {
      return value === condition;
    }

    // If condition is an object but not a comparison operation, it's a nested path
    if (!('==' in condition || '!=' in condition || '<' in condition || '>' in condition || '<=' in condition || '>=' in condition)) {
      // Recursively check all nested conditions
      return Object.entries(condition).every(([key, subCondition]) =>
        checkCondition(value[key], subCondition)
      );
    }

    // Handle comparison operations
    for (const [op, compareValue] of Object.entries(condition)) {
      switch (op) {
        case "==":
          if (value !== compareValue) return false;
          break;
        case "!=":
          if (value === compareValue) return false;
          break;
        case "<":
          if (typeof value === 'number' && typeof compareValue === 'number') {
            if (!(value < compareValue)) return false;
          }
          break;
        case ">":
          if (typeof value === 'number' && typeof compareValue === 'number') {
            if (!(value > compareValue)) return false;
          }
          break;
        case "<=":
          if (typeof value === 'number' && typeof compareValue === 'number') {
            if (!(value <= compareValue)) return false;
          }
          break;
        case ">=":
          if (typeof value === 'number' && typeof compareValue === 'number') {
            if (!(value >= compareValue)) return false;
          }
          break;
      }
    }
    return true;
  }

  return (entity: EntityValues<T>) => {
    for (const [key, condition] of Object.entries(whereClause)) {
      const fieldKey = key as keyof T;
      const value = entity[fieldKey];

      if (!checkCondition(value, condition)) {
        return false;
      }
    }
    return true;
  };
}