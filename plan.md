# 📋 Plan: FaST Guidelines Review

**Status**: 📋 PLANNED  
**Goal**: Comprehensive review of data project codebase against FaST guidelines to assess adherence and identify missing patterns

## Overview

This review will systematically analyze the `data` project source code against the FaST (Functional Subset of TypeScript) guidelines defined in `fast.md`. The review will identify:
1. How well the codebase adheres to FaST principles
2. Patterns and practices used in the codebase that aren't reflected in FaST
3. Opportunities to update either the codebase or FaST guidelines

---

## Task 1: Declarations & Binding Review

**Requirements**:
- Given the codebase, should identify all uses of `var`, `function`, `let`, `const`, arrow functions
- Given the findings, should categorize violations vs. acceptable imperative island usage
- Given the analysis, should document patterns that might need clarification in FaST

**Scope**: Scan entire `src/` directory for declaration patterns

---

## Task 2: Type System Review

**Requirements**:
- Given the codebase, should identify all uses of `enum`, `namespace`, `class`, `interface`, `type`
- Given the findings, should verify preference for `type` over `interface` for data types
- Given the analysis, should document any `namespace` usage patterns that might be acceptable
- Given the codebase, should check for `any` usage in public interfaces vs. implementations

**Scope**: Review type definitions across all modules

---

## Task 3: Data Expressions & Mutation Review

**Requirements**:
- Given the codebase, should identify mutation patterns (push/pop/splice, object field writes)
- Given the findings, should verify mutations only occur in imperative islands with owned data
- Given the analysis, should document mutation patterns that follow FaST principles
- Given the codebase, should check for `delete` operator usage

**Scope**: Review all mutation operations and verify ownership guarantees

---

## Task 4: Control Flow Review

**Requirements**:
- Given the codebase, should identify all `switch` statements
- Given the findings, should verify if discriminated unions could replace switches
- Given the codebase, should identify `for`, `while`, `for...of`, `for...in` usage
- Given the analysis, should verify loops are in imperative islands with owned data
- Given the codebase, should check for ternary and short-circuit patterns

**Scope**: Review control flow patterns across all modules

---

## Task 5: File Layout Structure Review

**Requirements**:
- Given the codebase, should verify adherence to FaST file layout guidelines
- Given the structure, should check if each type has: entrypoint (`<name>.ts`), public API (`public.ts`), utilities (one per file)
- Given the findings, should document deviations and their rationale
- Given the analysis, should identify patterns not covered by FaST layout guidelines

**Scope**: Review directory structure, especially in `math/`, `schema/`, `ecs/`, `types/`

---

## Task 6: Imperative Islands Analysis

**Requirements**:
- Given the codebase, should identify all imperative islands (functions with mutation/loops)
- Given each island, should verify: owned data, no input mutation, no external writes, no escape
- Given the findings, should document examples of well-formed imperative islands
- Given the analysis, should identify violations of imperative island rules

**Scope**: Deep analysis of functions containing `let`, loops, mutations

---

## Task 7: Patterns Not in FaST

**Requirements**:
- Given the codebase, should identify common patterns not mentioned in FaST
- Given the findings, should document: namespace exports (`export * as Name`), service interfaces, observable patterns, schema-driven types
- Given the analysis, should categorize patterns as: should be added to FaST, acceptable deviations, or anti-patterns

**Scope**: Identify unique patterns across the codebase

---

## Task 8: Compile Review Report

**Requirements**:
- Given all findings, should create comprehensive review report
- Given the report, should include: adherence score by category, violations list, missing patterns list, recommendations
- Given the recommendations, should prioritize: code fixes, FaST guideline updates, or both

**Scope**: Synthesize all findings into actionable report

