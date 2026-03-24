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
  // Support bold prefix via **text** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach(p => {
    if (p.startsWith("**") && p.endsWith("**")) {
      runs.push(new TextRun({ text: p.slice(2, -2), bold: true, font: "Arial", size: 20 }));
    } else {
      runs.push(new TextRun({ text: p, font: "Arial", size: 20 }));
    }
  });
  return new Paragraph({
    numbering: { reference: "bullets", level: opts.level || 0 },
    spacing: { after: opts.after || 60 },
    children: runs,
  });
}

function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    spacing: { after: 0, line: 260 },
    children: [new TextRun({ text: line, font: "Consolas", size: 17, color: "1F4E79" })],
  }));
}

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: headerShading,
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })],
  });
}

function cell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading || undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 18, ...opts })] })],
  });
}

function makeTable(headers, rows, colWidths) {
  const tableRows = [
    new TableRow({ children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
    ...rows.map((row, ri) => {
      const shading = ri % 2 === 1 ? altRowShading : undefined;
      return new TableRow({
        children: row.map((val, ci) => cell(val, colWidths[ci], { shading })),
      });
    }),
  ];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: tableRows,
  });
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
    config: [{
      reference: "bullets",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F4E79", space: 4 } },
          children: [
            new TextRun({ text: "CAPTRUST  ", font: "Arial", size: 18, bold: true, color: "1F4E79" }),
            new TextRun({ text: "IRP Report Configuration UI \u2014 Developer Guide", font: "Arial", size: 18, color: "808080" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9", space: 4 } },
          children: [
            new TextRun({ text: "CONFIDENTIAL \u2014 Page ", font: "Arial", size: 16, color: "808080" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "808080" }),
          ],
        })],
      }),
    },
    children: [
      // Title page
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Institutional Reporting Platform", font: "Arial", size: 48, bold: true, color: "1F4E79" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "Report Configuration UI", font: "Arial", size: 36, color: "2E75B6" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "Developer Guide", font: "Arial", size: 28, color: "808080" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Version 1.2.0  \u2014  ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, font: "Arial", size: 22, color: "595959" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "CAPTRUST Financial Advisors", font: "Arial", size: 22, color: "595959" })],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // TOC
      heading("Table of Contents"),
      para("1. Project Overview"),
      para("2. Technology Stack"),
      para("3. Project Structure"),
      para("4. Architecture & Design Patterns"),
      para("5. Data Model"),
      para("6. Key Components"),
      para("7. State Management & Persistence"),
      para("8. Permission Model"),
      para("9. Configuration Lifecycle"),
      para("10. Differences from Original Data Structure"),
      para("11. Getting Started"),
      para("12. Deployment & Sync"),

      new Paragraph({ children: [new PageBreak()] }),

      // 1. Project Overview
      heading("1. Project Overview"),
      para("This is a working interactive prototype for the CAPTRUST Institutional Reporting Platform (IRP) Report Configuration module. It demonstrates the full configuration workflow for institutional investment reports including single-plan, multi-plan, combo, and client-only report types."),
      para("The prototype uses browser localStorage as a persistence layer to simulate database behavior, allowing realistic CRUD operations, config loading/saving, and cross-plan sharing without requiring a backend server."),
      para("Purpose:", { bold: true }),
      bullet("Validate UX workflows and business logic before production development"),
      bullet("Serve as a functional specification for the development team"),
      bullet("Demonstrate data model relationships and config lifecycle"),
      bullet("Provide a portable demo that runs on any machine with Node.js"),

      new Paragraph({ children: [new PageBreak()] }),

      // 2. Technology Stack
      heading("2. Technology Stack"),
      makeTable(
        ["Technology", "Version", "Purpose"],
        [
          ["React", "18.x", "Component UI framework"],
          ["Vite", "8.x", "Build tool and dev server with HMR"],
          ["Ant Design", "5.x", "UI component library (tables, modals, forms, tags)"],
          ["JavaScript (ES6+)", "\u2014", "No TypeScript \u2014 plain JS for prototype speed"],
          ["localStorage", "\u2014", "Browser persistence layer (simulates database)"],
          ["docx (npm)", "9.x", "Schema document generation (.docx output)"],
          ["GitHub", "\u2014", "Source control and cross-machine sync"],
        ],
        [2400, 1560, 5400],
      ),
      para(""),
      para("The project intentionally avoids TypeScript, state management libraries (Redux, Zustand), and backend services to keep the prototype lightweight and easy to modify during requirements gathering.", { italics: true, color: "595959" }),

      new Paragraph({ children: [new PageBreak()] }),

      // 3. Project Structure
      heading("3. Project Structure"),
      ...codeBlock([
        "report-config-ui/",
        "  src/",
        "    App.jsx                  # Root component, state orchestration",
        "    main.jsx                 # Vite entry point",
        "    data/",
        "      mockData.js            # Seed data (clients, plans, investments, etc.)",
        "      dataResolvers.js       # Helper functions for data lookups",
        "    components/",
        "      SinglePlanConfig.jsx   # Single plan report config UI",
        "      MultiPlanConfig.jsx    # Multi plan report config UI",
        "      ComboConfig.jsx        # Combo report config UI",
        "      SaveConfigSection.jsx  # Save/load/confirm modals + shared config logic",
        "      LoadConfigModal.jsx    # Load saved config modal with ad hoc toggle",
        "      ExhibitMenuSection.jsx # Exhibit template management",
        "      BulkRunSection.jsx     # Bulk run scheduling config",
        "      FundChangesSection.jsx # Fund change tracking per plan",
        "      ManagerGroupsSection.jsx # Manager groups + candidate investments",
        "      MockDataAdmin.jsx      # Demo data CRUD admin drawer",
        "      DualListBox.jsx        # Reusable dual list box component",
        "  docs/",
        "    generate-schema-doc.cjs  # Generates IRP-Database-Schema.docx",
        "    generate-dev-guide.cjs   # Generates this document",
        "  CHANGELOG.md               # Versioned change log",
        "  package.json",
        "  vite.config.js",
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // 4. Architecture
      heading("4. Architecture & Design Patterns"),

      heading("Component Hierarchy", HeadingLevel.HEADING_3),
      para("App.jsx is the central orchestrator. It owns all top-level state (active client, plan, config type, loaded config, etc.) and passes props down to config type components. Each config type component (SinglePlanConfig, MultiPlanConfig, ComboConfig) manages its own internal state but delegates save/load operations back up to App.jsx via callbacks."),

      heading("Prop Drilling Pattern", HeadingLevel.HEADING_3),
      para("The prototype uses direct prop drilling rather than React Context to keep the data flow explicit and easy to trace. Key props flow from App.jsx through config components to SaveConfigSection and ExhibitMenuSection."),

      heading("Seed + Merge Pattern", HeadingLevel.HEADING_3),
      para("On startup, seed data from mockData.js is merged non-destructively into localStorage. New seed records are added, but existing user-modified records are preserved. This allows the demo data to expand across versions without wiping user changes."),
      ...codeBlock([
        "// Merge pattern (in App.jsx useEffect):",
        "const stored = JSON.parse(localStorage.getItem(key)) || [];",
        "const existingIds = new Set(stored.map(r => r.id));",
        "const merged = [...stored, ...seedData.filter(s => !existingIds.has(s.id))];",
        "localStorage.setItem(key, JSON.stringify(merged));",
      ]),

      heading("planConfigMap Pattern", HeadingLevel.HEADING_3),
      para("When a user loads or saves a config for a plan, the plan-to-config assignment is persisted in a separate localStorage key (irp-plan-config-map-v1). This allows config assignments to survive page reloads even when the config itself is a shared template not owned by the current plan."),

      heading("Auto-Load Fallback Chain", HeadingLevel.HEADING_3),
      para("When a single plan is selected, the system auto-loads a config using a 4-tier fallback:"),
      bullet("**Tier 1:** Primary config (marked as Primary for this plan)"),
      bullet("**Tier 2:** Assigned config from planConfigMap (previously loaded/saved for this plan)"),
      bullet("**Tier 3:** Most recently saved client config for this plan"),
      bullet("**Tier 4:** Plan's defaultConfigId (shared config assignment)"),

      new Paragraph({ children: [new PageBreak()] }),

      // 5. Data Model
      heading("5. Data Model"),
      para("The prototype's JavaScript data model closely mirrors the SQL schema documented in IRP-Database-Schema.docx. Key entities:"),

      makeTable(
        ["Entity", "localStorage Key", "Description"],
        [
          ["Clients", "irp-clients-v1", "Client accounts (AccountID, Name)"],
          ["Plans", "irp-plans-v1", "Plans per client (ct_PlanID, type, vendor)"],
          ["Investments", "irp-investments-v2", "Investments per plan (Ref, AssetClass, Order)"],
          ["Candidates", "irp-candidates-v1", "Candidate investments for comparison"],
          ["Report Configs", "irp-report-configs-v3", "Saved report configurations"],
          ["Exhibit Templates", "irp-exhibit-templates-v1", "Exhibit template definitions"],
          ["Template PageSets", "irp-exhibit-template-pagesets-v1", "Template-to-pageset junction"],
          ["Plan Groups", "irp-plan-groups-v1", "Multi-plan groupings"],
          ["Fund Changes", "irp-fund-changes-v1", "In-progress and executed fund changes"],
          ["Plan-Config Map", "irp-plan-config-map-v1", "Plan-to-config assignments"],
          ["Template Admin", "irp-is-template-admin", "Admin permission toggle"],
        ],
        [2800, 3560, 3000],
      ),

      heading("Shared vs Client-Owned", HeadingLevel.HEADING_3),
      para("Both ReportConfig and ExhibitTemplate use AccountID to control visibility:"),
      bullet("**AccountID = null** \u2192 CAPTRUST Shared \u2014 visible to all clients, modifiable only by template administrators"),
      bullet("**AccountID = [value]** \u2192 Client-owned \u2014 visible only to that client"),

      heading("Client-Shared Configs", HeadingLevel.HEADING_3),
      para("A client-level config used by multiple plans within the same client triggers an impact warning showing the count of affected plans. This is detected at runtime by cross-referencing planConfigMap, ct_PlanID, and defaultConfigId."),

      new Paragraph({ children: [new PageBreak()] }),

      // 6. Key Components
      heading("6. Key Components"),

      heading("App.jsx", HeadingLevel.HEADING_3),
      para("Central orchestrator (~950 lines). Manages: client/plan selection, config type tabs, config load/save lifecycle, auto-load logic, planConfigMap, template admin state. Renders the appropriate config type component and passes all required props."),

      heading("SinglePlanConfig.jsx", HeadingLevel.HEADING_3),
      para("Single plan report configuration. Manages: QDIA opt-out, fund change selections, manager groups, exhibit menu, bulk run settings, candidate investments. Uses a loadedConfig effect to hydrate all state from a loaded config object."),

      heading("MultiPlanConfig.jsx", HeadingLevel.HEADING_3),
      para("Multi plan report configuration. Adds: plan group management (create/rename/delete), dual list box for plan selection, per-plan fund change aggregation. Plan groups are persisted independently."),

      heading("ComboConfig.jsx", HeadingLevel.HEADING_3),
      para("Combo report configuration. Stitches together single + multi configs. Disabled sections (fund changes, QDIA, managers) are managed by child configs. Includes duplicate plan detection with urgent alert."),

      heading("SaveConfigSection.jsx", HeadingLevel.HEADING_3),
      para("Shared save/load UI used by all config types. Handles: Quick Save (update existing), Save As New, confirm modal with change diff, shared config detection (CAPTRUST-wide and client-level), impact warnings with plan counts, admin permission gating, association-only saves for shared templates."),

      heading("ExhibitMenuSection.jsx", HeadingLevel.HEADING_3),
      para("Exhibit template management. Features: category-based pageset selection, dual list box for exhibit ordering, template save/load/rename/delete, shared template permission checks, category restrictions by config type."),

      heading("LoadConfigModal.jsx", HeadingLevel.HEADING_3),
      para("Modal for loading saved configs. Sections: client configs and CAPTRUST shared configs. Features: search filter, ad hoc config toggle (hidden by default), rename/delete inline, type filtering."),

      heading("MockDataAdmin.jsx", HeadingLevel.HEADING_3),
      para("Demo data admin drawer. CRUD for: clients, plans, investments, candidates, fund changes. Includes: template admin permission toggle, export/import all data as JSON, inline editing."),

      new Paragraph({ children: [new PageBreak()] }),

      // 7. State Management
      heading("7. State Management & Persistence"),

      heading("localStorage Keys", HeadingLevel.HEADING_3),
      para("All data uses versioned localStorage keys (e.g., irp-investments-v2). When the data shape changes, the version suffix is incremented and the old key is ignored, allowing clean migration."),

      heading("Config Save Flow", HeadingLevel.HEADING_3),
      bullet("**Quick Save:** Updates existing config record in localStorage, shows confirm modal with change diff"),
      bullet("**Save As New:** Creates new config with auto-generated ID, optionally sets as Primary"),
      bullet("**Shared Config Association:** For CAPTRUST shared configs, saves the plan-to-config mapping without modifying the shared config itself"),
      bullet("**Admin Update:** Template administrators can save both the association and modify the shared config"),

      heading("Export/Import", HeadingLevel.HEADING_3),
      para("The Demo Data admin drawer supports full JSON export/import of all localStorage data. This enables moving demo data between machines or resetting to a known state."),

      new Paragraph({ children: [new PageBreak()] }),

      // 8. Permission Model
      heading("8. Permission Model"),
      para("The prototype implements a simplified permission model via the isTemplateAdmin toggle in the Demo Data admin drawer."),

      makeTable(
        ["Action", "Non-Admin", "Admin"],
        [
          ["Load shared config", "Yes", "Yes"],
          ["Associate plan to shared config", "Yes", "Yes"],
          ["Modify shared report config", "No \u2014 directed to Save As New", "Yes \u2014 with impact warning"],
          ["Modify shared exhibit template", "No \u2014 Permission Required modal", "Yes"],
          ["Delete shared exhibit template", "No", "Yes"],
          ["Create client-specific config", "Yes", "Yes"],
          ["Modify client config used by other plans", "Yes \u2014 with impact warning", "Yes \u2014 with impact warning"],
        ],
        [3500, 2930, 2930],
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // 9. Config Lifecycle
      heading("9. Configuration Lifecycle"),
      para("A typical configuration workflow:"),
      bullet("1. Select client and plan"),
      bullet("2. Choose report configuration type (Single, Multi, Combo)"),
      bullet("3. Load existing config or start fresh"),
      bullet("4. Configure sections: QDIA, fund changes, manager groups, exhibit menu, bulk run"),
      bullet("5. Save config (Quick Save or Save As New)"),
      bullet("6. Optionally run ad hoc report preview (Run Now)"),

      heading("Ad Hoc Runs", HeadingLevel.HEADING_3),
      para("Ad hoc runs create a child config with ParentReportConfigID referencing the source. This preserves the exact configuration state used for that run. Ad hoc configs are hidden by default in the Load modal and can be shown via toggle."),

      heading("Combo Composition", HeadingLevel.HEADING_3),
      para("Combo configs reference child single/multi configs. The combo inherits fund changes, QDIA, and manager settings from its children. Duplicate plan detection warns if the same plan appears in multiple child configs."),

      new Paragraph({ children: [new PageBreak()] }),

      // 10. Differences from Original
      heading("10. Differences from Original Data Structure"),
      para("The following fields and patterns were added to the prototype beyond the original data structure provided:"),

      makeTable(
        ["Addition", "Type", "Reason"],
        [
          ["Plan.DefaultConfigID", "FK to ReportConfig", "Enables shared config assignment per plan"],
          ["ReportConfig.CandidateInvestments", "BIT", "Tracks whether candidate investments are included"],
          ["ReportConfig.IncludeFundChanges", "BIT", "Master toggle for fund change tracking"],
          ["ReportConfig.OptInAllFundChanges", "BIT", "Auto-include all fund changes"],
          ["ReportConfig.ParentReportConfigID", "Self-referencing FK", "Links ad hoc runs to parent config"],
          ["ReportConfig.FundChangesInProgress", "JSON (prototype only)", "Denormalized fund change selections \u2014 normalized to ReportConfigFundChange in SQL"],
          ["ReportConfig.FundChangesExecuted", "JSON (prototype only)", "Same as above for executed changes"],
          ["ReportConfigCandidateInvmt", "New table", "Junction table for candidate investment selections"],
          ["ManagerOrderCustomized", "New table", "Custom investment ordering and grouping per config"],
          ["planConfigMap (localStorage)", "Runtime only", "Plan-to-config assignment tracking \u2014 maps to Plan.DefaultConfigID in SQL"],
          ["isTemplateAdmin (localStorage)", "Runtime only", "Permission toggle \u2014 would be a server-side role in production"],
          ["FundChange.CurrentInvestment", "Renamed", "Was CurrentFund in original \u2014 renamed to CurrentInvestment"],
          ["FundChange.ReplacementInvestment", "Renamed", "Was ReplacementFund \u2014 renamed to ReplacementInvestment"],
          ["Candidate.replacesRef", "Renamed concept", "Was 'Replaces' \u2014 now 'Compared Against' in UI"],
        ],
        [3200, 2560, 3600],
      ),

      para(""),
      para("The SQL DDL in IRP-Database-Schema.docx reflects the production-ready normalized schema. The prototype uses denormalized JSON for fund change selections and manager groups for simplicity, but these map cleanly to junction tables in SQL.", { italics: true, color: "595959" }),

      new Paragraph({ children: [new PageBreak()] }),

      // 11. Getting Started
      heading("11. Getting Started"),

      heading("Prerequisites", HeadingLevel.HEADING_3),
      bullet("Node.js 18+ (or portable Node.js on restricted machines)"),
      bullet("Git"),
      bullet("A modern browser (Chrome, Edge, Firefox)"),

      heading("Setup", HeadingLevel.HEADING_3),
      ...codeBlock([
        "git clone https://github.com/Michael-Chittenden/report-config-ui.git",
        "cd report-config-ui",
        "npm install",
        "npm run dev",
      ]),
      para(""),
      para("The dev server starts on http://localhost:5173 (or next available port). Vite provides hot module replacement (HMR) so code changes appear instantly in the browser."),

      heading("Building for Production", HeadingLevel.HEADING_3),
      ...codeBlock([
        "npm run build    # Outputs to dist/",
        "npm run preview  # Preview production build locally",
      ]),

      heading("Generating Documentation", HeadingLevel.HEADING_3),
      ...codeBlock([
        "cd docs",
        "node generate-schema-doc.cjs    # Regenerates IRP-Database-Schema.docx",
        "node generate-dev-guide.cjs     # Regenerates IRP-Developer-Guide.docx",
      ]),

      heading("Portable Node.js (Restricted Machines)", HeadingLevel.HEADING_3),
      para("If Node.js cannot be installed via MSI on a work machine:"),
      bullet("Download the Node.js Windows Binary (.zip) from nodejs.org"),
      bullet("Extract to C:\\node"),
      bullet("Run: set PATH=C:\\node;%PATH% before using npm commands"),

      new Paragraph({ children: [new PageBreak()] }),

      // 12. Deployment
      heading("12. Deployment & Sync"),

      heading("GitHub Workflow", HeadingLevel.HEADING_3),
      para("The repository is hosted at https://github.com/Michael-Chittenden/report-config-ui. To sync between machines:"),
      ...codeBlock([
        "# On development machine (after making changes):",
        "git add -A",
        'git commit -m "description of changes"',
        "git push",
        "",
        "# On work machine (to pull latest):",
        "git pull",
        "npm install   # Only needed if package.json changed",
      ]),

      heading("Data Portability", HeadingLevel.HEADING_3),
      para("Demo data lives in browser localStorage and is NOT synced via git. To move demo data between machines:"),
      bullet("Open Demo Data admin drawer"),
      bullet("Click Export Data \u2014 downloads a JSON file"),
      bullet("Transfer the JSON file to the other machine"),
      bullet("Open Demo Data admin and click Import Data"),

      heading("Sharing with Colleagues", HeadingLevel.HEADING_3),
      para("If the repository is private, add collaborators via GitHub Settings > Access > Add People. If public, anyone with the URL can clone and run it."),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("J:\\Git\\report-config-ui\\docs\\IRP-Developer-Guide.docx", buffer);
  console.log("Developer guide created: J:\\Git\\report-config-ui\\docs\\IRP-Developer-Guide.docx");
});
