# AGENTS.md

## Build & Verify

- `npm run dev` — Vite dev server at `http://localhost:5173`
- `npm run build` — Web build to `dist/`
- `npm run check` — svelte-check (type-check Svelte files)
- `npm run lint` — ESLint (`.ts`, `.svelte`)
- `npm test` — Vitest unit tests (jsdom + fake-indexeddb)
- `npm run test:watch` — Vitest in watch mode
- `npm run test:coverage` — Vitest with coverage
- `npm run tauri build` — Tauri desktop build (requires Rust + system libs)
- `npx cap sync android` — Sync web build to Android project

CI pipeline order: `lint -> test -> build` (web, then desktop matrix, then Android).

## Architecture

- **Svelte 5** with `svelte/store` writable stores (not runes `$state`/`$derived`; only `$props()` rune is used in components).
- **Dexie** (IndexedDB) for persistence. Schema defined in `src/lib/db/database.ts`. All DB access through typed repositories in `src/lib/db/`.
- **3 platforms** auto-detected at bootstrap in `src/main.ts`: web, Tauri (desktop), Capacitor (Android). Platform interface in `src/lib/platform/types.ts`, implementations in `src/platform/`.
- **ID generation**: nanoid with 12-char hex via `generateId()` in `src/lib/utils.ts`.
- **$lib/** path alias maps to `src/lib/`.

## Key conventions

- Tests live in `src/lib/db/__tests__/`; use Vitest with `fake-indexeddb/auto` (set up in `src/test-setup.ts`). Each test suite calls `new AutoTrackerDB()` + delete + open in `beforeEach` to isolate state.
- Prettier config: single quotes, trailing commas, 100 print width, semicolons.
- ESLint: warn on unused vars (prefix with `_` to ignore) and `no-explicit-any`.
