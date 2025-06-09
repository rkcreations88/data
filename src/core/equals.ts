/**
 * Compares two Data objects for deep equality.
 * Ordering of keys matters.
 * If order is not important then use normalize first.
 */

export function equals(a?: unknown, b?: unknown) {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
