# AutoTracker — Implementation Plan

## Executive Summary

AutoTracker is an offline-first, single-user, cross-platform application for tracking vehicle maintenance, issues, repairs, and ownership records. Users manage multiple vehicles, track odometer readings, schedule maintenance based on mileage or date intervals, log completed services with costs, and track issues through resolution. The app runs as a web application, a Tauri desktop app (Windows/Mac/Linux), and a Capacitor Android app — all sharing a single Svelte codebase with IndexedDB persistence. No cloud, no accounts, no server. Data is fully portable via JSON export/import.

---

## Goals

- Track multiple vehicles with full metadata (make, model, year, VIN, license plate, notes)
- Record odometer readings with switchable units (mi/km)
- Create scheduled maintenance items with odometer-based, date-based, or combined due triggers
- Log completed maintenance with cost, provider, and notes
- Track issues/repairs with a status workflow (open → in progress → resolved → closed)
- View a dashboard showing cross-vehicle overview of upcoming/overdue maintenance
- Do all of this fully offline with no server dependency
- Ship on Web, Desktop (Tauri), and Android (Capacitor) from one codebase
- Follow OS light/dark theme
- Include automated tests

## Non-Goals

- Multi-user or user accounts
- Cloud sync or server-side persistence
- Push notifications or email/SMS reminders
- Real-time collaboration
- Native iOS app (Capacitor iOS is possible but out of scope)
- Fuel economy or trip logging
- Parts inventory or mechanic directory
- Payment processing
- OBD-II / diagnostic scanner integration
- Public API or third-party integrations

---

## Requirements

### Functional

| ID | Requirement |
|---|---|
| F1 | Users can add, edit, and delete vehicles |
| F2 | Each vehicle stores name, make, model, year, VIN, license plate, notes |
| F3 | Users can record odometer readings with date and switchable units (mi/km) |
| F4 | Vehicles display last-known odometer reading and date |
| F5 | Users can create maintenance items with name, description, frequency interval (odometer, days, or both), and last-completed info |
| F6 | The app calculates and displays due/overdue status for each maintenance item |
| F7 | Users can mark maintenance as completed, recording date, odometer, cost, and service provider |
| F8 | Users can create issues with title, description, and severity |
| F9 | Issues follow a status workflow: Open → In Progress → Resolved → Closed |
| F10 | Issues support a timeline of updates (notes, status changes, repairs) |
| F11 | Dashboard shows all vehicles with next-due maintenance and overdue items |
| F12 | Users can export all data for backup |
| F13 | Users can import backup to restore data |
| F14 | The app follows the OS light/dark theme preference |
| F15 | The app is fully functional offline |

### Non-Functional

| ID | Requirement |
|---|---|
| NF1 | Single-page application loads and renders in < 2s on modern hardware |
| NF2 | Database operations complete in < 100ms for typical queries |
| NF3 | App works offline with zero network requests |
| NF4 | Data persists across app restarts without data loss |
| NF5 | Desktop binary launches in < 3s |
| NF6 | App handles 10+ vehicles, 100+ maintenance items, 100+ issues without performance degradation |

---

## Assumptions

- The user has one primary device; data is not expected to be shared across devices (no sync)
- The user has basic technical proficiency to double-click a desktop installer or install an APK
- The app uses the system webview on desktop (Tauri) and Android (Capacitor) — no embedded Chromium
- Odometer units are per-app setting, not per-vehicle
- Vehicle deletion is destructive (no soft-delete/recycle bin needed for MVP)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer (Svelte)                  │
│  Dashboard │ Vehicle Manager │ Maintenance │ Issues  │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              State / Store (Svelte $state)            │
│           Reactive, single-source-of-truth            │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│            Data Access Layer (Dexie.js)               │
│  IndexedDB wrapper with typed tables + queries        │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                IndexedDB (Browser API)                │
│          Persisted in browser / webview storage       │
└─────────────────────────────────────────────────────┘
                   │
┌──────────────────────────────────────────────────────┐
│         Platform Layer (adapter pattern)              │
├─────────────────┬─────────────────┬──────────────────┤
│   Web (static)  │ Tauri (Desktop) │ Capacitor (Android)│
│   - Vite build  │ - Rust backend  │ - Java/Kotlin     │
│   - Netlify/Vercel│ - Native menus │ - Native file access│
└─────────────────┴─────────────────┴──────────────────┘
```

**Key architectural decisions:**

- **Dexie.js + IndexedDB** as the universal storage engine — works identically in every target (browser, Tauri webview, Capacitor webview). No platform-specific SQLite adapters needed.
- **Svelte 5 runes** ($state, $derived, $effect) for state management — no external store library needed.
- **Repository pattern** over raw Dexie calls — all DB operations go through service modules for testability and future migration.

---

## Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Language | TypeScript 5 | Type safety across the full stack |
| UI Framework | Svelte 5 | Minimal boilerplate, reactive by default, small bundle size |
| Build Tool | Vite 6 | Fast HMR, native TS/ESM, extensible via plugins |
| Styling | CSS custom properties + base reset | No framework overhead; OS theme via `prefers-color-scheme` |
| Storage | Dexie.js 4 | IndexedDB wrapper, works everywhere, promise-based, indexed queries |
| Routing | svelte-spa-router or simple hash-based | Lightweight, no SSR needed |
| Testing | Vitest + Playwright | Unit tests (Vitest) + E2E (Playwright) |
| Linting | ESLint + Prettier | Consistent code style |
| Desktop | Tauri v2 | Rust backend, small binaries, system webview |
| Android | Capacitor v6 | WebView wrapper with native plugin access |
| Icons | Lucide | Consistent, lightweight, tree-shakeable icon set |
| UUID | nanoid | Compact, fast, URL-safe ID generation |

---

## Data Model

### Vehicle
| Field | Type | Notes |
|---|---|---|
| id | string (nanoid) | Primary key |
| name | string | Required, user-facing display name |
| make | string | e.g. Toyota |
| model | string | e.g. Camry |
| year | number | e.g. 2020 |
| vin | string | Vehicle Identification Number |
| licensePlate | string | License plate text |
| notes | string | Free-text |
| createdAt | ISO string | Auto-set |
| updatedAt | ISO string | Auto-set |

### OdometerReading
| Field | Type | Notes |
|---|---|---|
| id | string (nanoid) | Primary key |
| vehicleId | string | FK → Vehicle |
| value | number | Odometer value |
| unit | 'mi' \| 'km' | Unit at time of recording |
| date | ISO string | Date of reading |
| notes | string | Optional context |
| createdAt | ISO string | Auto-set |

### MaintenanceItem (scheduled template)
| Field | Type | Notes |
|---|---|---|
| id | string (nanoid) | Primary key |
| vehicleId | string | FK → Vehicle |
| name | string | e.g. "Oil Change" |
| description | string | Optional |
| intervalOdometer | number \| null | Miles or km (per app setting) |
| intervalDays | number \| null | Calendar days |
| lastCompletedDate | ISO string \| null | Set when completion logged |
| lastCompletedOdometer | number \| null | Set when completion logged |
| createdAt | ISO string | Auto-set |
| updatedAt | ISO string | Auto-set |

### MaintenanceRecord (completed instance)
| Field | Type | Notes |
|---|---|---|
| id | string (nanoid) | Primary key |
| vehicleId | string | FK → Vehicle |
| maintenanceItemId | string | FK → MaintenanceItem |
| completedDate | ISO string | Date of service |
| completedOdometer | number | Odometer at service |
| cost | number \| null | Total cost |
| serviceProvider | string \| null | Shop or person |
| notes | string \| null | Free-text |
| createdAt | ISO string | Auto-set |

### Issue
| Field | Type | Notes |
|---|---|---|
| id | string (nanoid) | Primary key |
| vehicleId | string | FK → Vehicle |
| title | string | Short summary |
| description | string | Detailed description |
| status | 'open' \| 'in-progress' \| 'resolved' \| 'closed' | Workflow state |
| severity | 'low' \| 'medium' \| 'high' \| 'critical' | Impact level |
| cost | number \| null | Total repair cost |
| serviceProvider | string \| null | Who fixed it |
| resolvedAt | ISO string \| null | When resolved |
| createdAt | ISO string | Auto-set |
| updatedAt | ISO string | Auto-set |

### IssueUpdate (timeline entry)
| Field | Type | Notes |
|---|---|---|
| id | string (nanoid) | Primary key |
| issueId | string | FK → Issue |
| type | 'note' \| 'status-change' \| 'repair' | Categorization |
| description | string | Free-text |
| previousStatus | string \| null | For status-change type |
| newStatus | string \| null | For status-change type |
| createdAt | ISO string | Auto-set |

### AppSettings (singleton)
| Field | Type | Notes |
|---|---|---|
| id | string | Always 'global' |
| odometerUnit | 'mi' \| 'km' | App-wide setting |
| theme | 'system' \| 'light' \| 'dark' | Follows OS by default |

**Indexes:**
- OdometerReading: `[vehicleId+date]`, `[vehicleId+value]`
- MaintenanceItem: `[vehicleId+name]`
- MaintenanceRecord: `[vehicleId+date]`, `[maintenanceItemId+date]`
- Issue: `[vehicleId+status]`, `[vehicleId+createdAt]`
- IssueUpdate: `[issueId+createdAt]`

---

## UI/UX Design

### Design System
- **Theme:** Follows OS light/dark preference via `prefers-color-scheme` media query, with optional manual override
- **Typography:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif`)
- **Spacing:** 4px grid (4, 8, 12, 16, 24, 32, 48, 64)
- **Colors:** CSS custom properties define palette; dark theme inverts backgrounds, adjusts contrast
- **Icons:** Lucide icons, inline SVG via Svelte components

### Page Structure

```
┌──────────────────────────────────────────────────┐
│  [App Logo]  Dashboard  Vehicles  Settings        │
│  ─────────────────────────────────────────────── │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  Dashboard                                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │ Vehicle 1 │ │ Vehicle 2 │ │ Vehicle 3 │    │ │
│  │  │ 45,230 mi │ │ 102,100km│ │ 12,400 mi │    │ │
│  │  │ 2 overdue │ │ 1 due    │ │ All good  │    │ │
│  │  └──────────┘ └──────────┘ └──────────┘      │ │
│  │                                                │ │
│  │  Overdue / Due Soon (cross-vehicle list)       │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Screens

1. **Dashboard** — Card grid of all vehicles with odometer snapshot. Below: a unified list of all upcoming/overdue maintenance across vehicles. Color badges: red (overdue), yellow (due within 30 days), green (up to date).

2. **Vehicle Detail** — Tab-based layout:
   - **Overview**: Vehicle metadata, odometer history chart (simple SVG line), quick actions
   - **Maintenance**: Two sections — Tracked Items (scheduled) and History (completed records). Each item shows name, interval, last-done, next-due, due status. Button to log completion inline.
   - **Issues**: List of issues with status badges. Click to view detail with timeline. Create new issue button.

3. **Issue Detail** — Title, description, severity, status. Timeline of updates (auto-generated on status changes + manual notes). Actions available based on current status.

4. **Settings** — Odometer unit toggle, theme selector, data export/import buttons, about info.

### Empty States
- New vehicle: "Add your first maintenance item to get started" with a prominent CTA
- No issues: "No issues tracked. Record an issue when something comes up."
- Dashboard with no vehicles: "Add your first vehicle to start tracking"

### Due Status Logic
- **OK**: Last completed + interval > today (or no interval set)
- **Due Soon**: 30 days before next due date OR within 10% of odometer interval
- **Overdue**: Past due date OR past odometer interval

---

## Platform Strategy

### Web
- Static HTML/CSS/JS output from `vite build`
- Can be hosted on any static host (Netlify, Vercel, GitHub Pages, S3)
- Fully functional offline once loaded (service worker caches app shell)

### Desktop (Tauri v2)
- Rust backend provides native file dialogs (for export/import), system tray, window management
- Uses system webview (WebKit on macOS/Linux, WebView2 on Windows)
- Binary size ~5-10MB
- Distribution: platform-specific installers built via Tauri bundler (DMG, MSI, AppImage/deb)

### Android (Capacitor v6)
- WebView app wrapping the same web build
- Additional plugins: File system access for export/import
- Distribution: AAB/APK via Capacitor build tools
- No Google Play Services dependency

### Code Sharing
- **100% shared** Svelte UI + Dexie data layer across all three platforms
- Platform-specific code isolated to thin wrappers:
  - Tauri: `src/platform/tauri/` — file dialogs, native hooks
  - Capacitor: `src/platform/capacitor/` — file access, share sheet
  - Web: `src/platform/web/` — fallback implementations
- A single `platform.ts` interface abstracts platform capabilities; each target injects its implementation

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Scaffold project, establish architecture, implement core data layer and basic UI shell.

- Initialize Vite + Svelte 5 + TypeScript project
- Configure ESLint, Prettier, Vitest, Playwright
- Set up Dexie.js database schema with all tables and indexes
- Implement data access layer (typed repository modules)
- Create basic app shell with navigation (sidebar/header)
- Implement OS theme detection and CSS custom property system
- Build settings page with odometer unit toggle, theme selector
- Create empty-state components

**Deliverables:**
- Running Vite dev server with navigation
- All database tables and CRUD operations tested via Vitest
- App shell with responsive layout
- Settings page functional

### Phase 2: Vehicle Management (Week 2-3)

**Goal:** Full CRUD for vehicles and odometer readings.

- Vehicle list view with cards/rows
- Vehicle creation/edit form (name, make, model, year, VIN, license, notes)
- Vehicle deletion with confirmation dialog
- Odometer reading form (value, unit, date, notes)
- Odometer reading history list
- Vehicle detail page showing odometer snapshot
- Basic vehicle card component for dashboard reuse

**Deliverables:**
- Add/edit/delete vehicles
- Record and view odometer history
- Vehicle detail page scaffolded with tab structure

### Phase 3: Maintenance Tracking (Week 3-4)

**Goal:** Full maintenance scheduling and completion logging.

- Create maintenance item form (name, description, odometer interval, day interval, optional last-completed)
- Maintenance item list on vehicle detail page
- Edit/delete maintenance items
- "Log completion" form (date, odometer, cost, provider, notes)
- Maintenance history view
- Due-status calculation engine
- Due-status badges and visual indicators (overdue/due-soon/OK)
- Maintenance summary section on dashboard

**Deliverables:**
- Create, edit, delete maintenance items
- Log completions with full details
- Due/overdue indicators on dashboard and vehicle pages
- Dashboard shows next-due items per vehicle

### Phase 4: Issue & Repair Tracking (Week 4-5)

**Goal:** Full issue lifecycle with timeline.

- Issue creation form (title, description, severity)
- Issue list on vehicle detail page with status filters
- Issue detail page with timeline
- Status transitions (Open → In Progress → Resolved → Closed) with confirmation
- Issue update / note-adding
- Auto-generated timeline entries for status changes
- Issue resolution with cost and provider fields
- Dashboard shows open issue count per vehicle

**Deliverables:**
- Full issue lifecycle
- Timeline view per issue
- Dashboard integration with issue counts

### Phase 5: Dashboard & Data Portability (Week 5-6)

**Goal:** Polish the dashboard and add import/export.

- Dashboard cross-vehicle overview grid
- Unified upcoming/overdue maintenance list
- Summary statistics (total vehicles, total maintenance items, open issues)
- JSON export (all data serialized to downloadable file)
- JSON import with validation and merge/overwrite strategy
- File dialogs wired for desktop (Tauri native) and web (download/upload)

**Deliverables:**
- Functional dashboard
- Working export/import
- Cross-platform file dialog integration

### Phase 6: Desktop App — Tauri (Week 6-7)

**Goal:** Package as a native desktop application.

- Initialize Tauri v2 project with Rust backend
- Configure window settings (title, min size, icon)
- Wire native file dialogs for export/import
- Add system tray icon with quick actions (optional)
- Configure Tauri bundler for platform installers
- Test on Windows, macOS, Linux
- CI builds for all three desktop platforms

**Deliverables:**
- Working Tauri desktop app
- Installers for Windows (MSI), macOS (DMG), Linux (AppImage/deb)

### Phase 7: Android App — Capacitor (Week 7-8)

**Goal:** Package as an Android application.

- Initialize Capacitor project
- Add Android platform
- Configure WebView settings (fullscreen, orientation)
- Wire Capacitor Filesystem plugin for export/import
- Add splash screen and app icon
- Configure app name, version, permissions
- Generate signed APK/AAB
- Test on emulator and physical device

**Deliverables:**
- Working Capacitor Android app
- Signed APK/AAB for distribution

### Phase 8: Testing & Polish (Week 8-10)

**Goal:** Comprehensive testing and bug fixing.

- Unit tests for all service modules (Vitest)
- Component tests for key UI components
- E2E tests for critical user flows (Playwright)
- Edge case testing (empty states, large datasets, rapid input)
- Accessibility audit (keyboard navigation, screen reader labels, color contrast)
- Performance profiling and optimization
- Error boundary implementation
- Loading state polish
- Final documentation

**Deliverables:**
- Test suite with >80% line coverage
- All critical flows covered by E2E tests
- Accessibility-compliant UI
- Documentation in README

---

## Milestones

| Milestone | Phase | Target | Exit Criteria |
|---|---|---|---|
| M1 — Core Engine | P1-P2 | End of Week 3 | Vehicles CRUD, odometer tracking, data persistence verified by tests |
| M2 — Maintenance MVP | P3 | End of Week 4 | Full maintenance lifecycle working (create, schedule, complete, due status) |
| M3 — Issues MVP | P4 | End of Week 5 | Full issue lifecycle working with timeline |
| M4 — Dashboard + Data | P5 | End of Week 6 | Dashboard functional, export/import working |
| M5 — Desktop Ship | P6 | End of Week 7 | Tauri app builds and runs on all three desktop platforms |
| M6 — Android Ship | P7 | End of Week 8 | Capacitor app builds and runs on Android |
| M7 — Production Ready | P8 | End of Week 10 | All tests passing, accessibility pass, documentation complete |

---

## Testing Strategy

### Unit Tests (Vitest)
- **Data layer:** All repository CRUD operations with mock Dexie instance
- **Due-status engine:** Pure function testing with various interval/date combinations
- **Validation:** Form validation logic
- **Date/odo calculations:** Edge cases (zero intervals, null values, future dates)

### Integration Tests (Vitest + Dexie in-memory)
- **Service workflows:** End-to-end flows through service layer (e.g., create vehicle → add maintenance item → log completion → verify due status)
- **Data integrity:** Foreign key validation, cascade behavior on delete

### E2E Tests (Playwright)
- **Critical user path:** Add vehicle → add maintenance item → log completion → verify dashboard update
- **Issue workflow:** Create issue → change status → add note → resolve → close
- **Settings toggle:** Switch odometer unit → verify display across pages
- **Import/Export:** Export data → clear → import → verify data integrity
- **Empty states:** Verify app behavior with no vehicles, no maintenance, no issues
- **Theme switching:** Verify light/dark mode rendering

### Test Infrastructure
- CI pipeline (GitHub Actions) runs on push/PR to main
- Parallel Vitest + Playwright runs
- Lint check (ESLint) before test execution
- Coverage report generated (target: >80% line coverage)

---

## Deployment Strategy

### Web
1. `npm run build` produces `dist/` directory
2. Deploy to static host (Netlify, Vercel, GitHub Pages, or S3+CloudFront)
3. A single command deploys: `npx netlify deploy --prod` or equivalent
4. No server configuration needed

### Desktop (Tauri)
1. `npm run tauri build` produces platform-specific installers
2. Artifacts: `.dmg` (macOS), `.msi` (Windows), `.AppImage` / `.deb` (Linux)
3. Distribution: GitHub Releases with artifacts attached
4. Auto-update via Tauri updater (future enhancement)

### Android (Capacitor)
1. `npx cap sync android && npx cap open android` for development
2. `cd android && ./gradlew bundleRelease` for production AAB
3. Sign with keystore, distribute via APK file or Play Store (future)

### CI/CD (GitHub Actions)
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - npm ci
      - npm run lint
      - npm run test:unit
      - npm run test:e2e

  build-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - npm run build
      - deploy to Netlify

  build-desktop:
    needs: test
    strategy:
      matrix: [ubuntu, macos, windows]
    steps:
      - npm run tauri build
      - upload artifacts

  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - npm run build
      - npx cap sync android
      - cd android && ./gradlew bundleRelease
      - upload APK/AAB
```

---

## Future Enhancements

- **iOS support** via Capacitor iOS (minor effort, architecture already supports it)
- **Auto-update** for desktop app via Tauri updater
- **Recurring maintenance** auto-creation on completion (creates next instance)
- **Service reminders** via system notifications (Tauri notification plugin)
- **Fuel economy tracking** with chart generation
- **Photo attachments** for receipts and damage (IndexedDB can store small blobs; large files need filesystem access)
- **Printable reports** (PDF generation via browser print API or jsPDF)
- **Multiple odometer units per vehicle** (e.g., switch one car to km independently)
- **E-bike / motorcycle / RV support** with custom field sets
- **Data encryption at rest** via Web Crypto API
- **QR code sharing** of vehicle data between devices (manual sync)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| IndexedDB data loss on browser storage clear | Medium | High | Warn user in docs; JSON export is defense; Tauri/Capacitor store in app data dir, less likely to be cleared |
| SQL-like queries limited in IndexedDB | Low | Medium | Dexie.js provides a rich query API; complex reporting can use in-memory aggregation |
| Tauri/Capacitor API differences | Low | Medium | Thin platform abstraction layer isolates platform-specific code; fallback to web APIs when native unavailable |
| Large photo attachments exceed storage | Medium | Low | Deferred to future; MVP stores text data only |
| Svelte 5 runes learning curve | Medium | Low | Team can reference Svelte 5 docs; patterns are well-defined |
| Android WebView inconsistencies | Medium | Medium | Test on multiple Android versions; use cross-platform CSS; avoid bleeding-edge web features |

---

## Task Breakdown

### Phase 1: Foundation
- [x] Initialize Vite + Svelte 5 + TypeScript project scaffold
- [x] Configure ESLint, Prettier, Vitest, Playwright
- [x] Create Dexie database class with all tables, indexes, and versioning
- [x] Implement repository modules: `vehicleRepository`, `odoReadingRepository`, `maintenanceItemRepository`, `maintenanceRecordRepository`, `issueRepository`, `issueUpdateRepository`, `settingsRepository`
- [x] Create `platform.ts` interface and web implementation
- [x] Build app shell: sidebar navigation, header, content area
- [x] Implement CSS custom property system with `prefers-color-scheme` detection
- [x] Build settings page with odometer unit toggle, theme override, data actions
- [x] Create reusable empty-state component
- [x] Write unit tests for all repositories (16 tests passing)

### Phase 2: Vehicle Management
- [x] Build vehicle list view (card layout)
- [x] Build vehicle form component (create/edit)
- [x] Implement vehicle deletion with confirmation dialog
- [x] Build odometer reading form
- [x] Build odometer reading history list
- [x] Build vehicle detail page with tabs scaffold
- [x] Build vehicle card component for dashboard
- [x] Add vehicle navigation from dashboard
- [x] Tests: vehicle CRUD, odometer CRUD

### Phase 3: Maintenance Tracking
- [x] Build maintenance item form (create/edit)
- [x] Build maintenance item list on vehicle detail page
- [x] Implement due-status calculation engine (`computeDueStatus`)
- [x] Apply due-status badges (overdue/due-soon/OK) on items
- [x] Build "Log Completion" form (date, odo, cost, provider, notes)
- [x] Build maintenance history list
- [x] Wire dashboard maintenance summary section
- [ ] Handle item re-creation/recurrence option (future)
- [x] Tests: maintenance CRUD, due-status edge cases

### Phase 4: Issue & Repair Tracking
- [x] Build issue creation form (title, description, severity)
- [x] Build issue list with status filter tabs on vehicle detail
- [x] Build issue detail page with header (title, status badge, severity badge)
- [x] Build issue timeline component
- [x] Implement status transition actions with confirmation
- [x] Build issue update/note form
- [x] Auto-generate timeline entries on status changes
- [x] Add open-issue count to dashboard vehicle cards
- [x] Tests: issue CRUD, status workflow, timeline generation

### Phase 5: Dashboard & Data Portability
- [x] Build dashboard vehicle grid with odometer snapshot
- [x] Build unified upcoming/overdue maintenance list
- [x] Add summary statistics bar (total vehicles, open issues, due items)
- [x] Implement JSON export (serialize all Dexie tables)
- [x] Implement JSON import with validation (schema version check, error reporting)
- [x] Web: file download/upload via Blob + input element
- [x] Tauri: native file save/open dialogs via Rust commands
- [x] Capacitor: file access via Capacitor Filesystem plugin (export)
- [ ] Tests: export/import round-trip, malformed input handling

### Phase 6: Desktop (Tauri)
- [x] Initialize Tauri v2 project
- [x] Configure `tauri.conf.json` (window title, min size, icons, bundle settings)
- [x] Implement Rust commands: `export_file`, `import_file`
- [x] Wire Tauri file dialogs in platform layer
- [x] Build and test on Linux (primary dev platform) — builds OK
- [ ] Test on macOS and Windows (pending)
- [ ] Configure CI for Tauri builds (pending)

### Phase 7: Android (Capacitor)
- [x] Initialize Capacitor project
- [x] Add Android platform
- [x] Implement Capacitor platform layer (file operations via `@capacitor/filesystem`)
- [ ] Configure app icon and splash screen (defaults used)
- [ ] Test on Android emulator (pending)
- [ ] Test on physical Android device (pending)
- [ ] Build signed APK/AAB (pending)

### Phase 8: Testing & Polish
- [ ] Complete unit test coverage (>80% lines)
- [ ] Write Playwright E2E tests for all critical user flows
- [ ] Accessibility review and fixes (a11y warnings present)
- [ ] Performance profiling (Lighthouse, bundle size analysis)
- [ ] Loading state and error boundary implementation
- [ ] Form validation polish (inline errors, disabled states)
- [ ] Final README documentation with screenshots and usage guide
- [ ] Create CI pipeline (GitHub Actions) for test + build

---

## Acceptance Criteria

### Vehicle Management
- [ ] User can add a vehicle with all fields (name, make, model, year, VIN, license, notes)
- [ ] User can edit any field on an existing vehicle
- [ ] User can delete a vehicle (with confirmation)
- [ ] Vehicle list shows all vehicles with name and last odometer reading
- [ ] Clicking a vehicle opens its detail page

### Odometer Tracking
- [ ] User can record an odometer reading with value, date, and optional notes
- [ ] Each vehicle shows its most recent odometer reading prominently
- [ ] Odometer reading history is viewable and sortable by date
- [ ] Switching the global odometer unit updates all displayed values (stored readings retain original unit)

### Maintenance Tracking
- [ ] User can create a maintenance item with name, description, optional odometer interval, optional day interval
- [ ] User can edit name and description of any maintenance item
- [ ] User can delete a maintenance item
- [ ] Each item displays its due status: OK (green), Due Soon (yellow), Overdue (red)
- [ ] Due status correctly handles odometer-only, date-only, and combined triggers
- [ ] User can log completion with date, odometer, cost, provider, and notes
- [ ] Completed maintenance appears in the history list
- [ ] Logging a completion updates the item's next-due calculation

### Issue Tracking
- [ ] User can create an issue with title, description, and severity
- [ ] Issue list shows all issues for a vehicle with status and severity badges
- [ ] User can filter issues by status
- [ ] User can change an issue's status: Open → In Progress → Resolved → Closed
- [ ] Each status transition is recorded in the timeline
- [ ] User can add free-text notes/updates to an issue
- [ ] User can record resolution cost and provider
- [ ] Issue detail page shows full timeline

### Dashboard
- [ ] Dashboard shows all vehicles as a grid of cards
- [ ] Each card shows vehicle name and last odometer reading
- [ ] Dashboard shows a consolidated list of upcoming/overdue maintenance across all vehicles
- [ ] Dashboard shows count of open issues per vehicle

### Settings
- [ ] User can switch odometer unit between mi and km
- [ ] Unit change is immediately reflected across all views
- [ ] Theme defaults to system preference with optional override
- [ ] User can export all data as a JSON file
- [ ] User can import a JSON backup file

### Platform
- [ ] App runs as a static web application (no server required)
- [ ] Desktop app launches, displays correctly, and supports native file dialogs
- [ ] Android app launches, displays correctly, and supports file access
- [ ] All data persists across app restarts on all platforms

### Quality
- [ ] All tests pass (lint, unit, E2E)
- [ ] Line coverage >80%
- [ ] No console errors or warnings
- [ ] App is keyboard-navigable
- [ ] Color contrast meets WCAG AA standards
- [ ] Loading states shown during data operations
- [ ] Error states handled gracefully with user-friendly messages
