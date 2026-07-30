# AGENTS.md

This project follows the implementation plan in PLAN.md (root of repo).

- Read PLAN.md before starting any work to understand architecture, data model, phases, and acceptance criteria.
- Work through phases in order; do not skip ahead.
- After completing any phase or making significant changes, update PLAN.md's status/task breakdown as appropriate.
- If new requirements emerge that aren't covered in PLAN.md, discuss them before diverging from the plan, then update this file and PLAN.md to stay in sync.
- Add any project-specific conventions, commands, or gotchas discovered during development to this file.

## Build Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Build web app (outputs to `dist/`)
- `npm test` — Run Vitest unit tests
- `npm run tauri build` — Build Tauri desktop app (requires Rust + system libs)
- `npx cap sync android` — Sync web build to Android project
- `npm run lint` — Run ESLint
- `npm run format` — Run Prettier

## Conventions

- Use `$lib/` path alias for imports from `src/lib/`
- Svelte 5 runes syntax: `$state()`, `$derived()`, `$effect()`, `$props()`
- All database operations go through typed repository modules in `src/lib/db/`
- Platform-specific code in `src/platform/` with interface defined in `src/lib/platform/types.ts`
- Use nanoid for ID generation (12-char hex)
