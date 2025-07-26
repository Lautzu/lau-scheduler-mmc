# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start Next.js development server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests with Vitest in watch mode
npm run test:run     # Run tests once without watch mode
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint linting
npm run prettier     # Format code with Prettier
npm run prettier:check  # Check code formatting
```

## Architecture Overview

This is a healthcare staff scheduler application for Makati Medical Center with the following key characteristics:

### Technology Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, App Router
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Testing**: Vitest with comprehensive unit and integration tests
- **Deployment**: Vercel with automatic GitHub integration

### Core Architecture Patterns

**Functional Programming Approach**: The scheduler follows functional programming patterns with pure functions for business logic. Core scheduling algorithms are in `lib/` directory and are fully testable without side effects.

**Separation of Concerns**: 
- `lib/` contains pure business logic (schedule-core, validation, assignment)
- `src/app/` contains Next.js UI components and pages
- `database.sql` defines the Supabase schema with RLS policies

**Legacy Migration Strategy**: The application migrates from localStorage to Supabase seamlessly. Original JavaScript modules in `lib/` maintain backward compatibility while adding database persistence.

### Key Directories

- `lib/` - Core scheduling logic (JavaScript modules with JSDoc types)
  - `schedule-core.js` - Pure scheduling algorithms and business rules
  - `schedule-assignment.js` - Employee assignment logic
  - `schedule-validation.js` - Schedule validation rules
  - `supabase.js` - Database utilities and migration helpers
  - `*.spec.js` - Comprehensive test suites for each module
- `src/app/` - Next.js application (TypeScript)
  - `login/` - Authentication pages
  - `scheduler/` - Main scheduling interface
  - `api/lib/[...path]/` - Dynamic API routes for lib functions
- `database.sql` - Complete Supabase schema setup
- `backup/` - Original HTML/JS implementation for reference

### Domain Model

**Core Entities**:
- `Employee` - Staff members with roles, tenure, and qualifications
- `Schedule` - Named schedule states with employee data and assignments
- `Shift` - Work periods (day, evening, night, day-ot, night-ot, off, leave)

**Business Rules**:
- Maximum 3 consecutive working days
- Minimum 2 off days per week
- No night-to-morning shift transitions
- Role-based department assignments
- Senior duty qualifications for ICU

### Testing Strategy

**Unit Tests**: Each `lib/*.js` file has corresponding `*.spec.js` tests using Vitest. Tests follow property-based testing where possible and avoid trivial assertions.

**Test Organization**: Tests are colocated with source files in `lib/` directory. Integration tests would be added for database operations and API endpoints.

**Business Logic Coverage**: Core scheduling algorithms have comprehensive test coverage including edge cases, constraint violations, and optimization scenarios.

## Environment Setup

1. Install dependencies: `npm install`
2. Set up Supabase project and run `database.sql` in SQL Editor
3. Copy `.env.local.example` to `.env.local` with your Supabase credentials
4. Run development server: `npm run dev`

## Development Guidelines

**Type Safety**: Uses JSDoc for type annotations in JavaScript files and full TypeScript in React components. Branded types are used for IDs following the existing pattern.

**Code Style**: Follows functional programming principles with pure, composable functions. Prettier and ESLint enforce consistent formatting and code quality.

**Database**: All database operations use Supabase client with Row Level Security. The `StorageUtils` object provides localStorage-compatible interface for database operations.

**Path Aliases**: 
- `@/*` maps to `./src/*`
- `@/lib/*` maps to `./lib/*`

## Testing

Run single test file: `npm run test -- schedule-core.spec.js`
Run with coverage: `npm run test -- --coverage`
Run specific test: `npm run test -- --grep "function name"`

Tests should pass both `npm run typecheck` and `npm run lint` before commits.

# Claude Code Guidelines by Sabrina Ramonov

## Implementation Best Practices

### 0 — Purpose  

These rules ensure maintainability, safety, and developer velocity. 
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

---

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work.  
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

---

### 2 — While Coding

- **C-1 (MUST)** Follow TDD: scaffold stub -> write failing test -> implement.
- **C-2 (MUST)** Name functions with existing domain vocabulary for consistency.  
- **C-3 (SHOULD NOT)** Introduce classes when small testable functions suffice.  
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-5 (MUST)** Prefer branded `type`s for IDs
  ```ts
  type UserId = Brand<string, 'UserId'>   // ✅ Good
  type UserId = string                    // ❌ Bad
  ```  
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-7 (SHOULD NOT)** Add comments except for critical caveats; rely on self‑explanatory code.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when more readable or interface merging is required. 
- **C-9 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability of an opaque block.

---

### 3 — Testing

- **T-1 (MUST)** For a simple function, colocate unit tests in `*.spec.ts` in same directory as source file.
- **T-2 (MUST)** For any API change, add/extend integration tests in `packages/api/test/*.spec.ts`.
- **T-3 (MUST)** ALWAYS separate pure-logic unit tests from DB-touching integration tests.
- **T-4 (SHOULD)** Prefer integration tests over heavy mocking.  
- **T-5 (SHOULD)** Unit-test complex algorithms thoroughly.
- **T-6 (SHOULD)** Test the entire structure in one assertion if possible
  ```ts
  expect(result).toBe([value]) // Good

  expect(result).toHaveLength(1); // Bad
  expect(result[0]).toBe(value); // Bad
  ```

---

### 4 — Database

- **D-1 (MUST)** Type DB helpers as `KyselyDatabase | Transaction<Database>`, so it works for both transactions and DB instances.  
- **D-2 (SHOULD)** Override incorrect generated types in `packages/shared/src/db-types.override.ts`. e.g. autogenerated types show incorrect BigInt value – so we override to `string` manually.

---

### 5 — Code Organization

- **O-1 (MUST)** Place code in `packages/shared` only if used by ≥ 2 packages.

---

### 6 — Tooling Gates

- **G-1 (MUST)** `prettier --check` passes.  
- **G-2 (MUST)** `turbo typecheck lint` passes.  

---

### 7 - Git

- **GH-1 (MUST**) Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT**) Refer to Claude or Anthropic in commit messages.

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have very high cyclomatic complexity? (number of independent paths, or, in a lot of cases, number of nesting if if-else as a proxy). If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this function much easier to follow and more robust? Parsers, trees, stacks / queues, etc.
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking core features (e.g. sql queries, redis, etc.)? If not, can this function be tested as part of an integration test?
7. Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead? Only care about non-trivial dependencies that can actually change or affect the function.
8. Brainstorm 3 better function names and see if the current name is the best, consistent with rest of codebase.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a compelling need, such as:
  - the refactored function is used in more than one place
  - the refactored function is easily unit testable while the original function is not AND you can't test it any other way
  - the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this checklist:

1. SHOULD parameterize inputs; never embed unexplained literals such as 42 or "foo" directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect. Trivial asserts (e.g., expect(2).toBe(2)) are forbidden.
3. SHOULD ensure the test description states exactly what the final expect verifies. If the wording and assert don’t align, rename or rewrite.
4. SHOULD compare results to independent, pre-computed expectations or to properties of the domain, never to the function’s output re-used as the oracle.
5. SHOULD follow the same lint, type-safety, and style rules as prod code (prettier, ESLint, strict types).
6. SHOULD express invariants or axioms (e.g., commutativity, idempotence, round-trip) rather than single hard-coded cases whenever practical. Use `fast-check` library e.g.
```
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { getCharacterCount } from './string';

describe('properties', () => {
  test('concatenation functoriality', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (a, b) =>
          getCharacterCount(a + b) ===
          getCharacterCount(a) + getCharacterCount(b)
      )
    );
  });
});
```

7. Unit tests for a function should be grouped under `describe(functionName, () => ...`.
8. Use `expect.any(...)` when testing for parameters that can be anything (e.g. variable ids).
9. ALWAYS use strong assertions over weaker ones e.g. `expect(x).toEqual(1)` instead of `expect(x).toBeGreaterThanOrEqual(1)`.
10. SHOULD test edge cases, realistic input, unexpected input, and value boundaries.
11. SHOULD NOT test conditions that are caught by the type checker.

## Code Organization

- `packages/api` - Fastify API server
  - `packages/api/src/publisher/*.ts` - Specific implementations of publishing to social media platforms
- `packages/web` - Next.js 15 app with App Router
- `packages/shared` - Shared types and utilities
  - `packages/shared/social.ts` - Character size and media validations for social media platforms
- `packages/api-schema` - API contract schemas using TypeBox

## Remember Shortcuts

Remember the following shortcuts which the user may invoke at any time.

### QNEW

When I type "qnew", this means:

```
Understand all BEST PRACTICES listed in CLAUDE.md.
Your code SHOULD ALWAYS follow these best practices.
```

### QPLAN
When I type "qplan", this means:
```
Analyze similar parts of the codebase and determine whether your plan:
- is consistent with rest of codebase
- introduces minimal changes
- reuses existing code
```

## QCODE

When I type "qcode", this means:

```
Implement your plan and make sure your new tests pass.
Always run tests to make sure you didn't break anything else.
Always run `prettier` on the newly created files to ensure standard formatting.
Always run `turbo typecheck lint` to make sure type checking and linting passes.
```

### QCHECK

When I type "qcheck", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR code change you introduced (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
2. CLAUDE.md checklist Writing Tests Best Practices.
3. CLAUDE.md checklist Implementation Best Practices.
```

### QCHECKF

When I type "qcheckf", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR function you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
```

### QCHECKT

When I type "qcheckt", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR test you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Tests Best Practices.
```

### QUX

When I type "qux", this means:

```
Imagine you are a human UX tester of the feature you implemented. 
Output a comprehensive list of scenarios you would test, sorted by highest priority.
```

### QGIT

When I type "qgit", this means:

```
Add all changes to staging, create a commit, and push to remote.

Follow this checklist for writing your commit message:
- SHOULD use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- SHOULD NOT refer to Claude or Anthropic in the commit message.
- SHOULD structure commit message as follows:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]
- commit SHOULD contain the following structural elements to communicate intent: 
fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.
```