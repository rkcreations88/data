# 📋 Plan: Monorepo Transition

**Status**: ✅ COMPLETED  
**Goal**: Transition pnpm-based `@adobe/data` repository into a pnpm workspace monorepo with four packages

## Overview

Split the current single-package repository into:

| Package | Scope | Contents | Published |
|---------|-------|----------|-----------|
| `@adobe/data` | Core | All source except `src/lit/`, `src/samples/` | Yes |
| `@adobe/data-lit` | Lit bindings | `src/lit/` (hooks, elements, decorators) | Yes |
| `data-lit-todo` | Sample app | `src/samples/todo/` | No |
| `@adobe/data-react` | React hooks | TBD (not implemented yet) | Future |

**Initial scope**: Implement `@adobe/data`, `@adobe/data-lit`, and `data-lit-todo`. Defer `@adobe/data-react`.

---

## Dependency Graph (Current)

```
src/lit/          → ecs, service, math, internal (via relative imports)
src/samples/todo/ → lit (ApplicationElement, ApplicationHost), ecs, schema, services
```

---

## Task 1: Create pnpm Workspace Root

**Requirements**:
- Create `pnpm-workspace.yaml` at repo root
- Define workspace packages: `packages/data`, `packages/data-lit`, `packages/data-lit-todo`
- Root `package.json` becomes workspace root with `"private": true` and workspace scripts

**Files to create**:
- `pnpm-workspace.yaml`

**Files to modify**:
- Root `package.json` (move to workspace root layout)

---

## Task 2: Extract @adobe/data (Core Package)

**Requirements**:
- Create `packages/data/` with all source **except** `src/lit/`, `src/samples/`
- Remove `lit` from dependencies and peerDependencies
- Remove `@lit/context` from devDependencies
- Remove `eslint-plugin-lit`, `eslint-plugin-lit-a11y` from devDependencies
- Remove Spectrum Web Components from devDependencies (used only by samples)
- Keep `./lit` export removed from package.json exports
- Preserve `typesVersions` for all remaining subpaths (functions, observe, cache, schema, etc.)
- Update `package.json` exports: remove `./lit`
- Preserve build scripts, typedoc, assembly, vitest

**Source to move**:
- `src/` minus `src/lit/`, `src/samples/`
- `assembly/`, `docs/`, `config/`, `scripts/`
- `tsconfig.json`, `tsconfig-base.json`, `typedoc.json`

**Dependencies to keep**:
- `@cfworker/json-schema`, `jsonpath` (runtime)
- AssemblyScript, TypeScript, Vitest, ESLint (core tooling only)
- No Lit, no Spectrum

---

## Task 3: Create @adobe/data-lit Package

**Requirements**:
- Create `packages/data-lit/` with `src/lit/` contents
- `package.json`: `name: "@adobe/data-lit"`, `peerDependencies: { "@adobe/data": "workspace:*", "lit": "^3.3.1" }`
- Update all imports: `../../ecs/` → `@adobe/data/ecs`, `../../service/` → `@adobe/data/service`, etc.
- Move `Vec2` type: either re-export from `@adobe/data/math` or keep local if it's lit-specific
- Add `eslint-plugin-lit`, `eslint-plugin-lit-a11y`, `@lit/context` as devDependencies
- Add `lit` as peerDependency and devDependency
- Exports: `.`, `./hooks`, `./elements`, `./decorators` (match current lit subpath API)
- `tsconfig` extends root/base, references `@adobe/data` for types

**Source structure**:
```
packages/data-lit/src/
  decorators/
  elements/
  functions/
  hooks/
  index.ts
```

**Import updates** (from relative to package):
- `Database` from `@adobe/data/ecs`
- `Service`, `isService` from `@adobe/data/service`
- `iterateSelfAndAncestors` stays local (in functions/)
- `Vec2` from `@adobe/data/math` (or math/vec2)

---

## Task 4: Create data-lit-todo Package (Sample)

**Requirements**:
- Create `packages/data-lit-todo/` with `src/samples/todo/` contents
- `package.json`: `name: "data-lit-todo"`, `private: true`, `dependencies: { "@adobe/data": "workspace:*", "@adobe/data-lit": "workspace:*", "lit": "^3.3.1" }`
- Add Spectrum Web Components as dependencies (or devDependencies)
- Update imports: `../../lit/` → `@adobe/data-lit`, `../../ecs/` → `@adobe/data/ecs`, etc.
- Standalone Vite app: `index.html`, `vite.config.js` (or shared)
- No publish script

**Source structure**:
```
packages/data-lit-todo/
  src/
    elements/
    services/
    todo-element.ts
    todo-host.ts
    todo-main-element.ts
    todo-sample.ts
  index.html
  package.json
  vite.config.js
```

**Dependencies**:
- `@adobe/data`, `@adobe/data-lit` (workspace)
- `lit`, `@spectrum-web-components/*` (button, card, checkbox, etc.)

---

## Task 5: Remove samples from Core; Update Root

**Requirements**:
- Remove `src/samples/` from `packages/data`
- Remove `samples` from any exports in `@adobe/data`
- Update root `index.html` to load from `packages/data-lit-todo` when running dev
- Root `package.json`: scripts for `pnpm -r build`, `pnpm -r test`, `pnpm dev` (or similar)
- Single `pnpm install` at root installs all workspace deps

---

## Task 6: Shared Configuration

**Requirements**:
- `tsconfig-base.json` at root for shared compiler options
- ESLint config: root config; `packages/data-lit` extends with lit plugins
- Prettier, lint-staged at root if applicable
- Consider `turbo` or `pnpm -r` for parallel builds (optional)

---

## Task 7: Clean Up Dependencies

**Requirements**:
- **@adobe/data**: Zero Lit, zero Spectrum; minimal runtime deps
- **@adobe/data-lit**: Only Lit (+ @lit/context) and @adobe/data
- **data-lit-todo**: Full UI deps ( Spectrum, Lit) — not published
- Run `pnpm install` and verify lockfile
- Remove unused packages from root and each package

---

## Task 8: Verification

**Requirements**:
- `pnpm build` at root builds all packages
- `pnpm test` at root runs all tests
- `pnpm dev` (or equivalent) serves data-lit-todo sample
- No circular dependencies
- CI (if any) updated for monorepo

---

## Suggested Order of Execution

1. **Task 1** – Create workspace root and `pnpm-workspace.yaml`
2. **Task 2** – Extract core into `packages/data`, remove lit/samples
3. **Task 3** – Create `packages/data-lit`, fix imports
4. **Task 4** – Create `packages/data-lit-todo`, fix imports
5. **Task 5** – Remove samples from core, wire root scripts
6. **Task 6** – Shared config (tsconfig, eslint)
7. **Task 7** – Dependency cleanup
8. **Task 8** – Verification

---

## Open Questions

1. **Vec2 in lit**: `src/lit/index.ts` exports `Vec2` from `../math/vec2`. Should `@adobe/data-lit` re-export `Vec2` from `@adobe/data/math` or keep a copy?
2. **Samples index**: Current `src/samples/index.ts` exports `samples` array and registers todo-host. This lives in the sample app now; `index.html` will import from `packages/data-lit-todo`.
3. **Assembly**: Stays in `packages/data`; no changes needed.
4. **data-react**: Deferred; create placeholder package later if desired.

---

## References

- [pnpm workspaces](https://pnpm.io/workspaces)
- Current structure: `src/`, `assembly/`, `config/`, `scripts/`, `docs/`
- Package exports: `package.json` lines 56–58, 31–44
