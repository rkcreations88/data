# Concurrency Ordering Epic

**Status**: 📋 PLANNED  
**Goal**: Extend the new ECS transactional store with deterministic ordering and rollback parity.

## Overview

WHY ensure collaborative updates stay deterministic—the new ECS must mirror the legacy concurrency semantics so multi-user or out-of-order transactions remain consistent and safe.

---

## CaptureConcurrencyRules

Summarize ordering and rollback expectations from the legacy ECS to guide implementation.

**Requirements**:
- Given the legacy concurrency implementation and tests, should produce a checklist of ordering and rollback behaviors the new store must satisfy.
- Given the derived checklist, should identify any supporting data the transactional store needs before changes begin.

---

## ImplementTransactionalOrdering

Adapt the transactional store to apply operations with legacy-compatible ordering and transient replay.

**Requirements**:
- Given multiple overlapping commits, should reorder operations by created time and user so final state matches the legacy ECS results.
- Given transient iterations from async generators, should rollback and replay prior operations to keep in-flight state aligned with legacy expectations.
- Given repository interface constraints, should avoid modifying exported Store, Database, or other external type definitions.

---

## ValidateRollbackAndErrors

Port or author Vitest suites that prove ordering and rollback parity in success and failure paths.

**Requirements**:
- Given any error thrown inside a transaction, should fully rollback all writes so no partial updates persist.
- Given concurrency scenarios equivalent to the legacy tests, should observe identical entity and resource outputs in the new ECS.

---

