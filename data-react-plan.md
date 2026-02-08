# 📋 Plan: @adobe/data-react Implementation

**Status**: ✅ COMPLETED  
**Goal**: Implement React bindings for `@adobe/data` — hooks and context for ECS database, observables, and transactions

---

## Overview

Port the essential patterns from `@adobe/data-lit` to React. React already provides `useState`, `useEffect`, `useMemo`, `useRef`, etc., so we **do not** replicate Lit's hooks. We focus on:

1. **Database context** — React Context equivalent of `DatabaseElement` (runtime extensible by plugins)
2. **Observable hooks** — Subscribe to `Observe<T>` from `@adobe/data/observe`
3. **Drag/drop** — If needed for parity with data-lit-todo

**Note**: `ApplicationElement` is obsolete; `DatabaseElement` is the new pattern. We implement the React equivalent of `DatabaseElement` via context.

---

## Lit → React Feature Mapping

| Lit Feature | React Equivalent | Action |
|-------------|------------------|--------|
| `DatabaseElement` | Context + `useDatabase` | **Implement** |
| `ApplicationElement` | — | **Skip** (obsolete) |
| `ApplicationHost` | — | **Skip** (obsolete) |
| `useObservable` | Custom hook wrapping `Observe<T>` | **Implement** |
| `useObservableValues` | Use `Observe.fromProperties` + `useObservable` | **Implement** |
| `useState`, `useEffect`, `useMemo`, `useRef` | React built-in | **Use native** |
| `useDragObserve`, `useDragTransaction` | Optional for drag/drop | **Defer** (Phase 2) |
| `useConnected` | React `useEffect` (mount/unmount) | **Use native** |
| `useElement` | `useRef` | **Use native** |
| `requireService` decorator | Runtime check in `useDatabase` | **Implicit** |
| `attachDecorator`, `withHooks` | N/A (Lit-specific) | **Skip** |

---

## Core API: `useDatabase`

```typescript
function useDatabase<T extends Database.Plugin>(plugin: T): Database.FromPlugin<T>
```

**Behavior**:
- Reads from React Context (provided by `DatabaseProvider`)
- If no ancestor provides a database, creates one with `Database.create(plugin)`
- If ancestor provides a database, extends it: `ancestorDatabase.extend(plugin)`
- Returns the typed database instance

**Provider**:
```typescript
type DatabaseProviderProps<P extends Database.Plugin> = {
  plugin: P;
  database?: Database.FromPlugin<P>; // optional pre-created instance
  children: React.ReactNode;
};

function DatabaseProvider<P extends Database.Plugin>(props: DatabaseProviderProps<P>): JSX.Element
```

---

## Task 1: Create Package Structure

**Requirements**:
- Create `packages/data-react/` in pnpm workspace
- `package.json`: `name: "@adobe/data-react"`, `private: false`
- `peerDependencies`: `"react": ">=17.0.0"` (flexible — supports React 17, 18, 19)
- `dependencies`: `"@adobe/data": "workspace:*"`
- `scripts`: `build`, `test`, `publish-public` (matches data-lit pattern)
- Copy LICENSE from root in build
- Add to `pnpm-workspace.yaml`

**Files to create**:
```
packages/data-react/
  package.json
  tsconfig.json
  src/
    index.ts
    context/
      database-context.ts
    hooks/
      use-database.ts
      use-observable.ts
      use-observable-values.ts
      index.ts
  README.md
```

---

## Task 2: Database Context & Provider

**Requirements**:
- Create `DatabaseContext` using `React.createContext<Database | null>(null)`
- Create `DatabaseProvider<P extends Database.Plugin>`:
  - Accepts `plugin`, optional `database`, `children`
  - If `database` prop provided, use it (for pre-created/shared instances)
  - Else: read from context; if ancestor has database, call `extend(plugin)`; else `Database.create(plugin)`
  - Store in context for descendants
- Use `React.useMemo` to avoid recreating database on re-render
- Memoize based on `plugin` identity (or schema hash if plugin is an object)

**Scope**: `src/context/database-context.ts`

---

## Task 3: `useDatabase` Hook

**Requirements**:
- `useDatabase<T extends Database.Plugin>(plugin: T): Database.FromPlugin<T>`
- Reads from `DatabaseContext`
- If no context value: create database with `Database.create(plugin)`
- If context value exists: return `context.extend(plugin)` (typed)
- Throw or warn if plugin is invalid
- Ensure same instance is returned across re-renders (context handles this)

**Scope**: `src/hooks/use-database.ts`

---

## Task 4: `useObservable` Hook

**Requirements**:
- `useObservable<T>(observable: Observe<T>): T | undefined`
- Subscribe to `Observe<T>` using `useEffect`
- Store latest value in `useState`
- Return `undefined` until first value is received (observable may emit synchronously)
- Unsubscribe on cleanup
- Handle `Observe` from `@adobe/data/observe`

**Scope**: `src/hooks/use-observable.ts`

---

## Task 5: `useObservableValues` Hook

**Requirements**:
- `useObservableValues<T extends Record<string, Observe<unknown>>>(factory: () => T, deps?: unknown[]): { [K in keyof T]: T[K] extends Observe<infer U> ? U : never } | undefined`
- Uses `useMemo` for factory result
- Uses `Observe.fromProperties` to combine
- Uses `useObservable` internally
- Return `undefined` until all properties have emitted

**Scope**: `src/hooks/use-observable-values.ts`

---

## Task 6: Package Config & Build

**Requirements**:
- `tsconfig.json` extends `../data/tsconfig-base.json` or shared base
- `exports` in package.json: `".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }`
- Build script: `cp ../../LICENSE . && tsc -b` (matches data-lit)
- Add `publish-public` script
- Add `test` script with `--passWithNoTests` or real tests
- Add to root `pnpm build`, `pnpm test`, `pnpm publish` flows

---

## Task 7: README & Documentation

**Requirements**:
- Brief README: install, `DatabaseProvider`, `useDatabase`, `useObservable`, `useObservableValues`
- Example usage snippet
- Peer dependency note: React 17+

---

## Task 8: Minimal Test / Sample (Optional)

**Requirements**:
- Unit test for `useDatabase` (mock context)
- Unit test for `useObservable` (mock Observe)
- Or create `data-react-todo` sample app (Phase 2)

---

## Peer Dependencies

```json
"peerDependencies": {
  "react": ">=17.0.0"
}
```

Flexible range to support React 17, 18, 19. Uses only common hooks: `useState`, `useEffect`, `useMemo`, `useContext`, `useRef`.

---

## Deferred (Phase 2)

- `useDragObserve`, `useDragTransaction` — if data-react-todo needs drag/drop
- `data-react-todo` sample app

---

## Suggested Order of Execution

1. **Task 1** — Create package structure, workspace entry
2. **Task 2** — Database context & provider
3. **Task 3** — `useDatabase` hook
4. **Task 4** — `useObservable` hook
5. **Task 5** — `useObservableValues` hook
6. **Task 6** — Build, publish config
7. **Task 7** — README
8. **Task 8** — Tests (optional)

---

## References

- `packages/data-lit/src/elements/database-element.ts`
- `packages/data/src/ecs/database/database.ts` (Database.Plugin, FromPlugin, extend)
- `packages/data-lit/src/hooks/use-observable.ts`, `use-observable-values.ts`
