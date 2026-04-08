const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, TabStopType, TabStopPosition,
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerShading = { fill: "1F4E79", type: ShadingType.CLEAR };
const altRowShading = { fill: "F2F7FB", type: ShadingType.CLEAR };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };
const PAGE_WIDTH = 12240;
const MARGINS = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS * 2;

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, font: "Arial" })] });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120 },
    children: [new TextRun({ text, font: "Arial", size: 20, italics: opts.italics || false, color: opts.color || "000000", bold: opts.bold || false })],
  });
}
function bullet(text, opts = {}) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach(p => {
    if (p.startsWith("**") && p.endsWith("**")) {
      runs.push(new TextRun({ text: p.slice(2, -2), bold: true, font: "Arial", size: 20 }));
    } else {
      runs.push(new TextRun({ text: p, font: "Arial", size: 20 }));
    }
  });
  return new Paragraph({
    numbering: { reference: opts.numbered ? "numbers" : "bullets", level: opts.level || 0 },
    spacing: { after: opts.after || 60 },
    children: runs,
  });
}
function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, shading: headerShading, margins: cellMargins, verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 18 })] })],
  });
}
function cell(text, width, opts = {}) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach(p => {
    if (p.startsWith("**") && p.endsWith("**")) runs.push(new TextRun({ text: p.slice(2, -2), bold: true, font: "Arial", size: 18, ...opts }));
    else runs.push(new TextRun({ text: p, font: "Arial", size: 18, ...opts }));
  });
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, shading: opts.shading || undefined, margins: cellMargins,
    children: [new Paragraph({ children: runs })],
  });
}
function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
      ...rows.map((row, ri) => {
        const shading = ri % 2 === 1 ? altRowShading : undefined;
        return new TableRow({ children: row.map((val, ci) => cell(val, colWidths[ci], { shading })) });
      }),
    ],
  });
}

// Story helper
function story(id, title, description, acceptance) {
  const children = [
    new Paragraph({ spacing: { before: 160, after: 60 }, children: [
      new TextRun({ text: `${id}: `, font: "Consolas", size: 18, bold: true, color: "1F4E79" }),
      new TextRun({ text: title, font: "Arial", size: 20, bold: true }),
    ]}),
    para(description, { italics: true, color: "595959" }),
  ];
  acceptance.forEach(ac => {
    children.push(new Paragraph({
      numbering: { reference: "bullets", level: 1 },
      spacing: { after: 40 },
      children: [new TextRun({ text: ac, font: "Arial", size: 18 })],
    }));
  });
  return children;
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "404040" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ],
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F4E79", space: 4 } },
        children: [
          new TextRun({ text: "CAPTRUST  ", font: "Arial", size: 18, bold: true, color: "1F4E79" }),
          new TextRun({ text: "IRP Report Configuration \u2014 Development Plan", font: "Arial", size: 18, color: "808080" }),
        ],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9", space: 4 } },
        children: [
          new TextRun({ text: "CONFIDENTIAL \u2014 Page ", font: "Arial", size: 16, color: "808080" }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "808080" }),
        ],
      })] }),
    },
    children: [
      // Title
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Institutional Reporting Platform", font: "Arial", size: 48, bold: true, color: "1F4E79" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Report Configuration Module", font: "Arial", size: 36, color: "2E75B6" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: "Development Plan \u2014 Features, User Stories & Phasing", font: "Arial", size: 28, color: "808080" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, font: "Arial", size: 22, color: "595959" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "CAPTRUST Financial Advisors", font: "Arial", size: 22, color: "595959" })] }),

      new Paragraph({ children: [new PageBreak()] }),

      // TOC
      heading("Table of Contents"),
      para("1. Project Context"),
      para("2. Technical Environment"),
      para("3. Development Phases Overview"),
      para("4. Phase 1: Foundation & Schema"),
      para("5. Phase 2: Report Configuration Core"),
      para("6. Phase 3: Exhibit Templates & Content"),
      para("7. Phase 4: Pageset Administration (Production Feature)"),
      para("8. Phase 5: Shared Configurations & Permissions"),
      para("9. Phase 6: Fund Changes & Investments"),
      para("10. Phase 7: Bulk Run Scheduling"),
      para("11. Phase 8: Plan Groups & Combo Reports"),
      para("12. Phase 9: IM PARis Reports"),
      para("13. Future Phases"),
      para("14. Dependencies & Risk"),

      new Paragraph({ children: [new PageBreak()] }),

      // 1. Project Context
      heading("1. Project Context"),
      para("The IRP Report Configuration module allows CAPTRUST advisors to configure institutional investment reports for their clients. Each report configuration defines which plans, investments, exhibits, fund changes, and scheduling parameters to include when generating quarterly reports."),
      para("A working interactive prototype has been built and validated with stakeholders. This document translates the prototype into development-ready features, user stories, and a recommended build order for the production implementation."),
      para("Key prototype reference: https://github.com/Michael-Chittenden/report-config-ui", { italics: true, color: "595959" }),

      new Paragraph({ children: [new PageBreak()] }),

      // 2. Technical Environment
      heading("2. Technical Environment"),
      makeTable(
        ["Component", "Technology", "Notes"],
        [
          ["Database", "Azure SQL", "Schema defined in IRP-Database-Schema.docx; team is building now"],
          ["Authentication", "Microsoft SSO", "Company-wide SSO via Azure AD / Entra ID"],
          ["Host Application", "MS Dynamics 365 CRM", "IRP module nested within existing CRM solution"],
          ["Frontend", "To be determined", "Prototype uses React + Ant Design; production may differ based on D365 constraints"],
          ["API Layer", "To be determined", "Needs to support CRUD for all entities; consider D365 Web API or custom API"],
          ["Prototype", "React + Vite + localStorage", "Reference implementation at GitHub repo above"],
        ],
        [2200, 2600, 4560],
      ),
      para(""),
      heading("Integration Points", HeadingLevel.HEADING_3),
      bullet("**D365 CRM context**: Client (Account) and Plan entities likely already exist in CRM; IRP should reference these rather than duplicating"),
      bullet("**User identity**: Current user from SSO determines permissions (template admin vs standard user)"),
      bullet("**Investment data**: ct_investmentid and ct_PlanID reference existing CAPTRUST data warehouse identifiers"),

      new Paragraph({ children: [new PageBreak()] }),

      // 3. Phases Overview
      heading("3. Development Phases Overview"),
      para("Phases are ordered by dependency and value delivery. Each phase produces a usable increment."),
      makeTable(
        ["Phase", "Name", "Depends On", "Key Deliverable"],
        [
          ["1", "Foundation & Schema", "\u2014", "Database tables, API scaffolding, auth integration"],
          ["2", "Report Configuration Core", "Phase 1", "Create/load/save single plan configs with Primary designation"],
          ["3", "Exhibit Templates & Content", "Phase 1", "Exhibit template CRUD, pageset selection, template sharing"],
          ["4", "Pageset Administration", "Phase 1", "Production admin for pagesets: categories, header text options, screenshots"],
          ["5", "Shared Configs & Permissions", "Phase 2", "CAPTRUST shared configs, template admin role, impact warnings"],
          ["6", "Fund Changes & Investments", "Phase 2", "Fund change tracking, investment ordering, candidate comparisons"],
          ["7", "Bulk Run Scheduling", "Phase 2, 3", "Bulk run settings, tier overrides, data thresholds"],
          ["8", "Plan Groups & Combo", "Phase 2, 3, 6", "Multi-plan groups, combo reports, duplicate detection"],
          ["9", "IM PARis Reports", "Phase 3, 4", "PARis performance books and investment policies per plan"],
        ],
        [900, 2600, 1800, 4060],
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 1
      heading("4. Phase 1: Foundation & Schema"),
      para("Establishes the database, API layer, and authentication. All subsequent phases depend on this."),

      heading("Epic 1.1: Database Schema", HeadingLevel.HEADING_3),
      ...story("US-101", "Create reference tables",
        "As a developer, I need the lookup tables created so that foreign keys can reference valid values.",
        ["ReportConfigType, PeriodType, ExhibitMenuType, BulkTierOverride, BulkPctThreshold, PageSetCategory tables created with seed data",
         "All tables match IRP-Database-Schema.docx DDL",
         "Seed data inserted for all lookup values"]),
      ...story("US-102", "Create core entity tables",
        "As a developer, I need Client, Plan, Investment, and PageSet tables available for the configuration module.",
        ["Client table references D365 Account entity (AccountID = D365 GUID)",
         "Plan table with ct_PlanID, AccountID FK, PlanType, Vendor, DefaultTier, DefaultConfigID",
         "Investment table with ct_investmentid, ct_PlanID FK, Ref, AssetClass, SortOrder",
         "PageSet table with PageSetID, Name, PageSetCategoryID FK, IsTab"]),
      ...story("US-103", "Create configuration tables",
        "As a developer, I need the ReportConfig, ExhibitTemplate, and all junction tables created.",
        ["ReportConfig with all columns per schema (including ParentReportConfigID self-reference)",
         "ExhibitTemplate with AccountID nullable (NULL = CAPTRUST shared)",
         "PageSetOption table (PageSetOptionID, PageSetID, HeaderText)",
         "ExhibitTemplatePageSet with PageSetOptionID nullable FK",
         "FundChange, ReportConfigFundChange, ReportPlanGroup, ReportConfigPlan, ComboConfigChild",
         "ManagerOrderCustomized, ReportConfigCandidateInvmt",
         "All foreign keys and constraints match schema doc"]),

      heading("Epic 1.2: API Scaffolding", HeadingLevel.HEADING_3),
      ...story("US-110", "API endpoints for CRUD operations",
        "As a developer, I need REST or D365 Web API endpoints for all entities so the UI can read and write data.",
        ["GET/POST/PUT/DELETE for ReportConfig, ExhibitTemplate, and their junction tables",
         "Endpoints respect D365 security context (current user)",
         "Bulk operations supported where needed (e.g., saving all exhibit pagesets for a template)"]),
      ...story("US-111", "Authentication integration",
        "As a user, I am automatically authenticated via Microsoft SSO when I access the IRP module within D365.",
        ["No separate login required",
         "User identity available to API for UserID field on saved records",
         "Template admin permission derivable from user role or security group"]),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 2
      heading("5. Phase 2: Report Configuration Core"),
      para("The core configuration workflow: select client/plan, create/load/save configs, set Primary."),

      heading("Epic 2.1: Client & Plan Context", HeadingLevel.HEADING_3),
      ...story("US-201", "Client context from D365",
        "As an advisor, the client I am working with in D365 automatically sets the context for report configuration.",
        ["Client AccountID resolved from D365 CRM context",
         "Plans filtered to selected client",
         "Switching clients resets configuration state"]),
      ...story("US-202", "Plan selection for single plan configs",
        "As an advisor, I can select a plan from my client to configure a single plan report.",
        ["Dropdown shows all plans for the current client with name and type (DC/NQ/DB)",
         "Selecting a plan auto-loads the Primary config if one exists",
         "Plan type visible alongside name"]),

      heading("Epic 2.2: Config CRUD", HeadingLevel.HEADING_3),
      ...story("US-210", "Save new report configuration",
        "As an advisor, I can save my current configuration settings as a named report configuration.",
        ["Config name required",
         "Option to set as Primary (clears Primary from other configs of same type/plan)",
         "Option to share as CAPTRUST template (sets AccountID = NULL)",
         "All settings persisted: QDIA, bulk run, exhibit template, fund changes, investments"]),
      ...story("US-211", "Load saved report configuration",
        "As an advisor, I can load a previously saved configuration to continue editing or review it.",
        ["Modal shows client configs and CAPTRUST shared configs in separate sections",
         "Search filter across config names",
         "Ad hoc configs hidden by default with toggle to show",
         "Loading restores all settings including exhibit template and fund changes"]),
      ...story("US-212", "Quick save (update existing config)",
        "As an advisor, I can save changes to the currently loaded configuration with one click.",
        ["Confirm modal shows diff of changed fields (before/after)",
         "Primary config warning shown when modifying the Primary",
         "Preserves Primary flag if already set"]),
      ...story("US-213", "Set as Primary from config banner",
        "As an advisor, I can designate any loaded config as the Primary for this plan without going through the full save flow.",
        ["'Set as Primary' button visible when loaded config is not Primary",
         "Clicking sets Primary on this config and clears it from others of same type/plan",
         "Works for both client-owned and shared configs",
         "Persists immediately without requiring a separate save"]),
      ...story("US-214", "Save As New configuration",
        "As an advisor, I can create a copy of my current config with a new name.",
        ["New config name required",
         "Original config unchanged",
         "New config gets its own ReportConfigID"]),
      ...story("US-215", "Auto-load fallback chain",
        "As an advisor, when I select a plan, the system automatically loads the best available config.",
        ["Priority: (1) Primary config for this plan, (2) Previously assigned config, (3) Most recently saved client config, (4) Plan default shared config",
         "Auto-loaded configs do not show 'Configuration loaded' toast",
         "If no config found, UI shows empty state with prompt to create or load"]),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 3
      heading("6. Phase 3: Exhibit Templates & Content"),
      para("Exhibit template management: create, load, save, share templates. Category-based pageset selection."),

      heading("Epic 3.1: Exhibit Template CRUD", HeadingLevel.HEADING_3),
      ...story("US-301", "Create exhibit template",
        "As an advisor, I can save my current exhibit selection as a named template for reuse.",
        ["Template name required",
         "Option to share as CAPTRUST template (AccountID = NULL)",
         "Selected pagesets saved with sort order in ExhibitTemplatePageSet",
         "PageSetOptionID saved per pageset when custom header selected"]),
      ...story("US-302", "Load exhibit template",
        "As an advisor, I can load a saved exhibit template to populate my exhibit selections.",
        ["Modal shows client templates and CAPTRUST shared templates",
         "Loading replaces current exhibit selections",
         "Template name displayed in Exhibit Menu header"]),
      ...story("US-303", "Update and rename exhibit templates",
        "As an advisor, I can update or rename an existing exhibit template.",
        ["Update saves current selections over the existing template",
         "Rename changes the template name only",
         "Shared template modifications require template admin permission"]),

      heading("Epic 3.2: Pageset Selection", HeadingLevel.HEADING_3),
      ...story("US-310", "Category-filtered pageset selection",
        "As an advisor, I can browse pagesets by category and select which ones to include in my report.",
        ["Category dropdown filters available pagesets",
         "Dual list box: Available (left) and Selected (right) with move buttons",
         "Available exhibits sorted alphabetically",
         "Category restrictions enforced: Single Plan categories disabled for multi/combo, Multi Plan disabled for combo, IM PARis enabled for single and plan groups only"]),
      ...story("US-311", "Exhibit screenshot preview",
        "As an advisor, I can see a representative screenshot of an exhibit before selecting it.",
        ["Hover over available exhibit shows screenshot popover (if image uploaded)",
         "Camera icon at end of exhibit name indicates screenshot available",
         "Selected exhibits do NOT show screenshot on hover (show header text instead)"]),
      ...story("US-312", "Exhibit header text selection",
        "As an advisor, I can choose which header text variant to use for exhibits that have multiple options.",
        ["Selected exhibits show default header text on hover",
         "Info icon appears on selected exhibits with multiple header options",
         "Clicking info icon opens modal to choose from available header text options",
         "Selected header stored as PageSetOptionID in ExhibitTemplatePageSet"]),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 4
      heading("7. Phase 4: Pageset Administration (Production Feature)"),
      para("Unlike other demo features, pageset administration is a production requirement. This provides the admin UI for managing pagesets, their categories, header text options, and representative screenshots.", { bold: true }),

      heading("Epic 4.1: Pageset Management", HeadingLevel.HEADING_3),
      ...story("US-401", "View pagesets by category",
        "As an admin, I can see all pagesets organized by their category groupings.",
        ["All 7 categories displayed with pageset counts",
         "Tab exhibits visually distinguished",
         "Pagesets sortable and searchable"]),
      ...story("US-402", "Add new pageset",
        "As an admin, I can add a new pageset to a category.",
        ["Name, category, and isTab flag required",
         "PageSetID auto-generated",
         "New pageset immediately available in exhibit selection"]),
      ...story("US-403", "Edit pageset properties",
        "As an admin, I can rename a pageset or change its category assignment.",
        ["Inline editing of name",
         "Category reassignment via dropdown",
         "Changes reflected everywhere the pageset is referenced"]),

      heading("Epic 4.2: Header Text Options (PageSetOption)", HeadingLevel.HEADING_3),
      ...story("US-410", "Manage header text options per pageset",
        "As an admin, I can configure multiple header text options for a pageset.",
        ["Each pageset starts with a 'Default' header option",
         "Admin can add additional header text options",
         "Each option creates a row in PageSetOption table (PageSetOptionID, PageSetID, HeaderText)",
         "Options can be edited or deleted (minimum one required)",
         "Header options available in exhibit template configuration for advisors to choose from"]),
      ...story("US-411", "Upload pageset screenshot",
        "As an admin, I can upload a representative screenshot for a pageset.",
        ["Image upload per pageset (PNG, JPG supported)",
         "Images stored in blob storage or database",
         "Screenshots visible to advisors when browsing available exhibits",
         "Replace and remove functionality"]),

      heading("Schema: PageSetOption Table", HeadingLevel.HEADING_3),
      makeTable(
        ["Column", "Type", "Description"],
        [
          ["PageSetOptionID", "INT IDENTITY (PK)", "Auto-incrementing ID"],
          ["PageSetID", "INT (FK)", "References PageSet"],
          ["HeaderText", "NVARCHAR(200)", "Custom header text for this pageset variant"],
        ],
        [2800, 2600, 3960],
      ),
      para(""),
      para("ExhibitTemplatePageSet.PageSetOptionID (nullable FK) references this table. NULL = use default header.", { italics: true, color: "595959" }),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 5
      heading("8. Phase 5: Shared Configurations & Permissions"),
      para("Shared config handling across clients with role-based modification controls."),

      heading("Epic 5.1: Shared Config Lifecycle", HeadingLevel.HEADING_3),
      ...story("US-501", "Associate plan to shared config",
        "As an advisor, I can link my plan to a CAPTRUST shared report configuration without modifying it.",
        ["Save Association button saves plan-to-config mapping only",
         "Shared config record itself is unchanged",
         "Association persisted so it auto-loads on next visit"]),
      ...story("US-502", "Shared config modification (admin only)",
        "As a template admin, I can modify a shared CAPTRUST configuration and save the changes.",
        ["'Save Association & Update Config' button available to admins only",
         "Impact warning shows count of plans using this shared config",
         "Non-admin users directed to 'Save As New' for client-specific copy"]),
      ...story("US-503", "Client-shared config impact warning",
        "As an advisor, when I modify a client config used by other plans, I see how many plans will be affected.",
        ["Warning shows count and names of other plans using the same config",
         "Displayed in the save confirmation modal",
         "Applies to both Quick Save and Save As flows"]),

      heading("Epic 5.2: Permission Model", HeadingLevel.HEADING_3),
      ...story("US-510", "Template admin role",
        "As a system admin, I can designate users as template administrators who can modify shared configs and templates.",
        ["Template admin permission derived from D365 security role or group",
         "Non-admins can use but not modify shared resources",
         "Non-admins can create client-specific copies",
         "Permission checked on both shared report configs and shared exhibit templates"]),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 6
      heading("9. Phase 6: Fund Changes & Investments"),

      heading("Epic 6.1: Fund Change Tracking", HeadingLevel.HEADING_3),
      ...story("US-601", "Include fund changes in report",
        "As an advisor, I can select which fund changes (in-progress and past year) to include in the report.",
        ["Master toggle to include/exclude fund changes section",
         "Opt-in-all toggle for convenience",
         "Individual checkbox per fund change (in-progress and executed separately)",
         "Selections saved per report config in ReportConfigFundChange junction table"]),
      ...story("US-602", "QDIA compliance check opt-out",
        "As an advisor, I can opt out of QDIA assignment validation for this report.",
        ["Checkbox to opt out of QDIA checks",
         "Default is unchecked (validation required)",
         "Stored as QDIACheckOptOut on ReportConfig"]),

      heading("Epic 6.2: Ad Hoc Report Run", HeadingLevel.HEADING_3),
      ...story("US-610", "Run report ad hoc",
        "As an advisor, I can queue a one-time report run for a specific period.",
        ["Select time period (current or previous quarter)",
         "Creates a child config (ParentReportConfigID references source)",
         "Preview modal shows: plans, investments, fund changes, exhibits with header text",
         "Primary config is not modified",
         "Ad hoc configs hidden in load modal by default"]),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 7
      heading("10. Phase 7: Bulk Run Scheduling"),

      ...story("US-701", "Bulk run configuration",
        "As an advisor, I can configure whether this report runs in the scheduled bulk process.",
        ["Include in Bulk Run toggle",
         "Tier override selection (Force Tier 1/2/3 or default)",
         "Manager data threshold (50% or 80%)",
         "Settings saved on ReportConfig record"]),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 8
      heading("11. Phase 8: Plan Groups & Combo Reports"),

      heading("Epic 8.1: Plan Groups (Multi Plan)", HeadingLevel.HEADING_3),
      ...story("US-801", "Create and manage plan groups",
        "As an advisor, I can group multiple plans for a multi-plan report.",
        ["Dual list box for plan selection with type/vendor filters",
         "Save plan groups with names for reuse",
         "Load, rename, delete saved plan groups",
         "Plan group saved with report config (_planIds, _planGroupId)"]),
      ...story("US-802", "Multi-plan config with aggregated data",
        "As an advisor, I can configure a plan group report with aggregated investments and fund changes.",
        ["Investments aggregated across all plans in the group",
         "Fund changes shown per plan with plan selector",
         "Exhibit template selection with multi-plan category access",
         "Individual summaries toggle for optional per-plan detail"]),

      heading("Epic 8.2: Combo Reports", HeadingLevel.HEADING_3),
      ...story("US-810", "Combine single and multi plan configs",
        "As an advisor, I can create a combo report that combines multiple existing report configurations.",
        ["Dual list box showing eligible single and multi plan configs",
         "'Primary only' filter on available configs",
         "Duplicate plan detection with urgent warning",
         "Child config exhibit pages displayed in combo view"]),
      ...story("US-811", "Combo config persistence",
        "As an advisor, combo configs save and restore their child config selections.",
        ["_selectedConfigIDs persisted on combo config record",
         "Loading a combo config restores child selections, exhibit template, and all settings",
         "Aggregate/replace spotlight options saved"]),

      new Paragraph({ children: [new PageBreak()] }),

      // Phase 9
      heading("12. Phase 9: IM PARis Reports"),
      para("PARis (Performance and Risk) reports require plan-specific performance books. The IM PARis Reports category provides per-plan variants."),

      ...story("US-901", "PARis performance book pagesets",
        "As an advisor, I can include PARis Performance Books for up to 4 plans in a report.",
        ["PARis Performance Book - Plan 1/2/3/4 available as pagesets",
         "Available in both Single Plan and Plan Groups config types",
         "Disabled for Combo reports",
         "Category: IM PARis Reports (category 7)"]),

      new Paragraph({ children: [new PageBreak()] }),

      // Future
      heading("13. Future Phases"),
      para("The following features were explored in the prototype but are not MVP. They should be planned for subsequent releases."),

      heading("Bulk Run Dashboard", HeadingLevel.HEADING_3),
      para("Centralized view of all bulk-scheduled report configs across all clients. Shows tier settings, investment counts, completion status, and exhibit templates. Includes Review modal with full config preview."),

      heading("Asset Class / Manager Groups", HeadingLevel.HEADING_3),
      para("Custom investment ordering and grouping within reports. Candidate investment comparison (Compared Against). Currently deactivated in prototype pending workflow finalization."),

      heading("Investment Completion Tracking", HeadingLevel.HEADING_3),
      para("Quarter-end completion status per investment, feeding into dashboard completion percentages and report status (Pending/Delayed/Completed)."),

      new Paragraph({ children: [new PageBreak()] }),

      // Dependencies
      heading("14. Dependencies & Risk"),

      heading("Technical Dependencies", HeadingLevel.HEADING_3),
      bullet("**D365 CRM integration**: Client and Plan entity mapping must be defined before Phase 2"),
      bullet("**Azure SQL schema**: Must be finalized and deployed before any phase can begin API work"),
      bullet("**SSO integration**: Required for Phase 1 completion; can be stubbed for early development"),
      bullet("**Blob storage**: Required for pageset screenshots (Phase 4); could use Azure Blob or database VARBINARY"),
      bullet("**Investment data source**: ct_investmentid mapping to data warehouse must be established for Phase 6"),

      heading("Key Risks", HeadingLevel.HEADING_3),
      bullet("**D365 UI constraints**: If the production UI must use D365 components (Power Apps), the React prototype patterns may not directly translate. Validate early."),
      bullet("**Shared config concurrency**: Multiple advisors modifying the same shared config simultaneously could cause conflicts. Consider optimistic concurrency with LastSaved timestamps."),
      bullet("**localStorage to SQL migration**: Prototype data in localStorage cannot be directly migrated. Export/import JSON can seed initial test data."),
      bullet("**Performance at scale**: Shared configs could be associated with thousands of plans. Impact warnings should show counts only (not plan names) at scale."),

      heading("Prototype Reference", HeadingLevel.HEADING_3),
      para("The interactive prototype at https://github.com/Michael-Chittenden/report-config-ui demonstrates all MVP workflows. Developers should run the prototype locally to understand the intended UX before implementing each phase. See README.md for setup instructions."),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("J:\\Git\\report-config-ui\\docs\\IRP-Development-Plan.docx", buffer);
  console.log("Document created: J:\\Git\\report-config-ui\\docs\\IRP-Development-Plan.docx");
});
