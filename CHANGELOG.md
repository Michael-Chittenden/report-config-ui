# Changelog — IRP Report Configuration UI

All notable changes to this project will be documented in this file.

## [1.5.0] — 2026-04-07

### IM PARis Reports, Header Selection, Exhibit Screenshots

**Report Type & Category Changes**
- Multi Plan tab renamed to "Plan Groups"
- Category renames: "Single Plan Only" → "Single Plan", "Multi Plan Only" → "Multi Plan", "Single Plan with Liabilities Only" → "Single Plan with Liabilities"
- Category 7 renamed to "IM PARis Reports" — enabled for Single Plan and Plan Groups
- DB Performance Book and DB Investment Policy moved to IM PARis Reports
- 6 new PARis pagesets: Performance Book + Investment Policy for Plans 1-4
- 5 new NQ Mirror pagesets added to Single Plan with Liabilities (ps-215 to ps-219)
- Available exhibits sorted alphabetically

**Exhibit Screenshot Previews**
- Upload representative screenshots per pageset via Demo Data > Pagesets tab
- Green border + camera icon on pagesets with uploaded images
- Hover over available exhibits to see screenshot popover (400px)
- Export/Import includes screenshot data

**Exhibit Header Text Options**
- Configure multiple header text options per pageset in admin
- Selected exhibits show default header on hover
- Info icon on selected exhibits with multiple header options — click to choose
- Header selection modal with radio-style picker

**Schema: PageSetOption Table**
- New table: PageSetOption (PageSetOptionID, PageSetID, HeaderText)
- ExhibitTemplatePageSet gains PageSetOptionID column (nullable FK)
- NULL = default header, non-null = selected header text variant
- Updated IRP-Database-Schema.docx

**Set as Primary**
- "Set as Primary" button on active config banner (works for both client and shared configs)
- Save preserves Primary flag set via banner button

---

## [1.4.0] — 2026-03-31

### Combo Restore, Dashboard Enhancements, UX Polish

**Combo Config Persistence**
- Combo configs now save and restore child config selections, exhibit template, and combo options
- _selectedConfigIDs, _aggregateFactSheets, _replaceSpotlights persisted on config records
- "Primary only" filter on combo available configs list

**Bulk Dashboard**
- Combo configs show child config names and resolved plans
- "Report Status" column replaces "Data Ready" (Completed/Delayed/Pending based on investment completion)
- "Review" button opens full config preview with plans, investments, fund changes, and exhibit pages
- Ad hoc runs excluded from dashboard
- Exhibit template column with shared tag

**Exhibit Visibility**
- Child config exhibit pages shown in combo config section and Run Now modal
- Exhibit pages added to ad hoc Run Now dialog for all config types
- Fixed exhibit resolution for user-saved templates (_sessionIds fallback)

**Demo Data Admin**
- "Q Complete" checkbox per investment for quarter completion tracking
- Pagesets tab showing all exhibits grouped by category
- Export/Import now includes report configs, exhibit templates, and plan groups

**Other**
- COMBO Title Page added to COMBO (Client) pageset category
- Section group labels: Data Checks, Included Investments, Content, Scheduling
- "Fund changes executed since last quarter" renamed to "executed in the past year"
- Asset Class | Managers section deactivated (commented for future use)

---

## [1.3.0] — 2026-03-31

### Bulk Dashboard & Data Tracking

**Bulk Run Dashboard**
- Centralized view of all bulk-scheduled report configs across all clients
- Columns: client, config name, type, plans, exhibit template, tier, investments, completed, data ready
- Search and client filter, sortable columns
- Shared config and shared exhibit template tags (purple "Shared" badge)
- "Data Ready" and "Run Report" placeholders for future functionality
- Client configs only (shared templates excluded from dashboard)

**Investment Completion Tracking**
- "Q Complete" checkbox per investment in Demo Data admin
- "Completed" column on Bulk Dashboard shows X/Y (%) with color coding

**Visual Rebrand**
- CAPTRUST corporate color palette applied across all components
- Primary: #00437B (dark navy), Secondary: #3465CD, Light: #5FB4E5, Plum: #5B325F, Teal: #7CA7AE
- IRP logo in app header
- Section group labels: Data Checks, Included Investments, Content, Scheduling

**Export/Import Enhancements**
- Now includes report configs, exhibit templates, and plan groups (previously missing)

**Other Changes**
- Asset Class | Managers section deactivated (commented for future use)
- "Fund changes executed since last quarter" renamed to "executed in the past year"
- npm audit fix: resolved brace-expansion and picomatch vulnerabilities

---

## [1.2.0] — 2026-03-24

### Shared Config & Permission Enhancements

**Shared Config Impact Warnings**
- CAPTRUST-wide shared configs show plan count impact in save confirm modal
- Client-level configs used by multiple plans show impact warning with affected plan names
- Impact warnings display for both single and multi plan config types

**Permission Model**
- Template admin toggle in Demo Data admin drawer (persisted in localStorage)
- Non-admin users blocked from modifying shared CAPTRUST configs — directed to "Save As New"
- Non-admin users blocked from modifying shared exhibit templates — Permission Required modal
- Admin users see two save options: "Save Association" (link only) or "Save Association & Update Config"

**Config Association Flow**
- Users can associate any plan to a shared config without admin permissions
- planConfigMap persistence ensures config assignments survive page reload
- 4-tier auto-load fallback: Primary → assigned → most recent client → defaultConfigId

**Load Config Modal**
- Ad hoc configs hidden by default with toggle to show/hide
- "Load Saved Report Config" button disabled until config type is selected

**UI Improvements**
- Combined "Report configuration and exhibit template loaded" toast (single message)
- React StrictMode double-toast fix using ref dedup guard
- Shared exhibit template indicator ("Shared" tag) in Exhibit Menu header

**Terminology Updates**
- "Replaces" → "Compared Against" for candidate investments
- "Current Fund" → "Current Investment" and "Replacement Fund" → "Replacement Investment"

**Documentation**
- IRP-Database-Schema.docx — full SQL DDL with schema specification
- IRP-Developer-Guide.docx — architecture, technology stack, component guide, setup instructions

---

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
