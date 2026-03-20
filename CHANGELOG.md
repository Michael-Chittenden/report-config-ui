# Changelog — IRP Report Configuration UI

All notable changes to this project will be documented in this file.

## [1.0.0] — 2026-03-20

### Initial Release

**Core Architecture**
- Vite + React + Ant Design scaffold
- localStorage persistence with versioned keys and seed merge patterns
- 300 seeded investment records from Excel import
- Export/Import demo data (JSON) for portability across environments

**Report Configuration Types**
- **Single Plan** — per-plan config with QDIA, fund changes, manager groups, exhibit menu, bulk run
- **Multi Plan** — plan group selection, per-plan fund changes, aggregated investments
- **Combo** — stitches together single + multi configs; disabled sections (fund changes, QDIA, managers) managed by children; duplicate plan detection with urgent alert

**Key Features**
- Plan Group management (create, rename, delete) with config persistence
- Exhibit Menu with category-based pageset selection, dual list box, template save/load/rename/delete
- Exhibit template sharing (CAPTRUST-wide vs client-specific) with type filtering per config type
- Category restrictions: "Single Plan Only" disabled for multi/combo, "Multi Plan Only" disabled for combo
- Fund Changes section: per-plan with In Progress / Since Last Quarter types, plan selector for multi
- Manager Groups with candidate investment mapping (global, not plan-specific)
- Candidate investment modal for selecting alternatives per investment
- Bulk Run configuration with tier overrides and percentage thresholds
- Load/Save/Switch config workflow with auto-load of primary config
- "Run Now" ad-hoc report preview showing per-plan investments, fund changes, and source configs
- Config dirty-state tracking with unsaved changes warnings

**Demo Data Admin**
- Client, Plan, Investment, Candidate, Fund Change CRUD
- Inline rename for clients and plans
- Plan selector filters on investments, candidates, fund changes tabs
- Export/Import all demo data as JSON

**UI/UX**
- Collapsible sections with summary counts in headers
- Primary config gold star tags
- Plan group name tags on combo config list
- Combo duplicate plan detection (red error alert with affected plans and config names)
