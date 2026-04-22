# Changelog — IRP Report Configuration UI

All notable changes to this project will be documented in this file.

## [1.9.0] — 2026-04-17

### Combo Child Suppression + COMBO Pagesets

**Combo child exhibit suppression**
- When a Core Shared (Cat 1) pageset is added to a Combo exhibit template,
  a red/gray stop icon appears in the Selected Exhibits list
- Clicking toggles suppression of matching pagesets in child configs at render time
- Lets users build real Combo-level cover pages (Title, ToC, Market Commentary,
  spotlights) without duplicating those pages from each child config
- Persisted on the combo config record as _comboSuppressMap
- Rendering (actual deduplication) is handled by the backend report generator

**New COMBO pagesets**
- ps-82 COMBO Table of Contents
- ps-83 COMBO Selected Report Configurations — placeholder marking where
  child config pages stitch into the output (pagesets above render before,
  pagesets below render after)

**Icons**
- Consolidated type icon: MergeCellsOutlined (merger of plans)
- Combo type icon: BlockOutlined (distinct blocks stitched together)

---

## [1.8.0] — 2026-04-17

### Renamed Report Config Type + Type Descriptions

**Report config type renamed**
- "Plan Groups" report configuration type renamed to "Consolidated"
- Disambiguates from the Plan Group feature (grouping of plans within Consolidated)
  and from Multi Plan exhibit templates (those still called Multi Plan)
- Updated in: config type selector, Load Config modal, Bulk Dashboard filters,
  exhibit category restrictions, combo description, fund changes / manager groups
  managed-by notes, save type display strings, seed data _displayType

**Type descriptions**
- Each config type tab now has a hover tooltip explaining what it does
- Descriptive text line appears below the selector showing details for the selected type
- Single Plan: single plan with investments, fund changes, exhibits
- Consolidated: combines multiple plans; Plan Groups define inclusion; exhibits aggregate or iterate
- Combo: stitches Single Plan + Consolidated configs together

---

## [1.7.2] — 2026-04-17

- Fix: switching config types no longer carries exhibit selections across
  (Plan Group → Single Plan was hydrating stale plan group state into Single Plan)
- loadedConfig is cleared when config type changes
- Each config component guards against hydrating from a different type's loadedConfig

---

## [1.7.1] — 2026-04-17

- Removed "Include individual plan Asset Summaries" checkbox from Plan Group exhibit menu (behavior now managed by per-exhibit plan iteration toggle)

---

## [1.7.0] — 2026-04-17

### Critical Fix: Image Storage + Save Reliability

**Root cause identified**
- Exhibit screenshots were stored in localStorage as base64 (~1.3x file size)
- localStorage has a ~5-10 MB quota per origin
- A few full-size uploads would fill the quota
- All subsequent localStorage writes (configs, plan groups, templates) silently failed
- On reload, the app showed stale pre-save state — looking like saves "didn't work"

**Fix: IndexedDB for screenshots**
- Moved exhibit images from localStorage to IndexedDB (quota: hundreds of MB vs ~5 MB)
- One-time automatic migration on first load (existing images preserved)
- New utility: src/utils/imageDb.js (loadAllImages, putImage, deleteImage)

**Image compression on upload**
- Uploaded screenshots now resized to max 1200px longest edge, JPEG quality 0.8
- Typical 2 MB screenshot → ~200 KB (10x smaller)
- Upload toast shows compressed size

**Surface storage errors**
- All localStorage writes now use safeSetLocalStorage helper
- First quota error surfaces a visible toast (instead of silent failure)
- Image save failures also surface as toasts

---

## [1.6.0] — 2026-04-17

### UX Refinements, Plan Iteration, Auto-Load Fixes

**Data Checks**
- QDIA opt-out moved to top of Data Checks section (was standalone)
- Data Checks description: "Report readiness problems and data warnings"
- New warning when exhibit template is missing a Title Page
- New warning when exhibit template is missing a Disclosure page

**Config Types & Categories**
- Client Only config type hidden from selector
- Plan Groups: Single Plan and Single Plan with Liabilities categories unlocked
- Combo: QDIA moved to Data Checks section, removed standalone QDIA section
- Combo: Asset Class / Manager Groups section removed
- Category 4 renamed: "COMBO (Client)" → "Client / Combo"

**Included Investments**
- Removed candidate managers reference from description (feature hidden)

**Load Config Modal**
- "Plan" column renamed to "Plan Name"
- Shared configs show associated plan names (via planConfigMap) for plans in current client

**Shared Config Protection**
- Non-admin users blocked from saving a shared config with a changed exhibit template
- Prompt to "Save As New" since exhibit template change disconnects from shared config

**Plan Iteration (new)**
- Single Plan and Single Plan with Liabilities exhibits added to Plan Groups can iterate per plan
- Repeat icon appears on applicable selected exhibits
- Modal to choose: Single Instance vs One per Plan (Iterate)
- Report logic will repeat the exhibit for each plan in plan group order

**Auto-Load & Primary Fixes**
- Plan Groups / Combo auto-load now falls back to most recent saved config (was only Primary)
- Previously saved Plan Group configs now persist across view switches
- Set as Primary button verifies config type matches current view
- Set as Primary explicitly sets ReportConfigType to correct mismatched state

**Documentation**
- IRP-Pageset-Reference.docx: production PageSetID column added alongside prototype IDs
- pageset-id-mapping.json for dev team migration reference

---

## [1.5.2] — 2026-04-07

### Bug Fixes & Exhibit Headers

**Auto-Load Fixes**
- Ad hoc runs no longer overwrite planConfigMap (was causing Primary shared config to not load)
- Auto-load fallback excludes ad hoc configs from assigned config lookup
- Auto-load preserves Primary flag from assigned config
- Dependency array includes planConfigMap for shared config detection

**Exhibit Headers in Run Preview**
- Combo ad hoc Run Now modal shows header text for child config exhibits
- All exhibit lists (single, plan groups, combo) show configured header text

**Pageset Updates**
- Investment Review | Select Commentary moved to Single Plan
- Single Plan with Liabilities appears after Single Plan in category dropdown

**Documentation**
- IRP-Development-Plan.docx: 9 phases, 30+ user stories with acceptance criteria
- Pageset Administration marked as production feature (not demo-only)
- Technical environment: Azure SQL, MS SSO, D365 CRM integration

---

## [1.5.1] — 2026-04-07

### Pageset Updates, Dashboard Polish, Ad Hoc Exhibits

**Pageset Moves & Renames**
- Investment Policy Monitor (Active + TDF) moved to Single Plan category
- DB Investment Policy Summary restored to original name, moved to Single Plan
- Removed PARis Investment Policy Plan 2/3/4 variants
- 5 new NQ Mirror pagesets added to Single Plan with Liabilities (ps-215 to ps-219)
- Category renames: "Single Plan Only" → "Single Plan", "Multi Plan Only" → "Multi Plan", "Single Plan with Liabilities Only" → "Single Plan with Liabilities"

**Dashboard Polish**
- "Investments" column shortened to "Invmts"
- "Completed" column shortened to "Comp %"

**Ad Hoc Run Exhibits**
- Run Now preview modal now shows each exhibit with its configured header text
- Default headers shown in gray, custom headers in blue
- Header text passed through from all config types (Single, Plan Groups, Combo)

---

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
