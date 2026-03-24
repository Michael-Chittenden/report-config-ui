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

// Page dimensions
const PAGE_WIDTH = 12240;
const MARGINS = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS * 2; // 9360

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
  const runs = [];
  // Support bold prefix via **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach(p => {
    if (p.startsWith("**") && p.endsWith("**")) {
      runs.push(new TextRun({ text: p.slice(2, -2), bold: true, font: "Consolas", size: 18, ...opts }));
    } else {
      runs.push(new TextRun({ text: p, font: opts.mono ? "Consolas" : "Arial", size: 18, ...opts }));
    }
  });
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading || undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: runs })],
  });
}

function monoCell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading || undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Consolas", size: 17, ...opts })] })],
  });
}

function makeTable(headers, rows, colWidths) {
  const tableRows = [
    new TableRow({ children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
    ...rows.map((row, ri) => {
      const shading = ri % 2 === 1 ? altRowShading : undefined;
      return new TableRow({
        children: row.map((val, ci) => {
          if (ci === 0) return monoCell(val, colWidths[ci], { shading, bold: true });
          if (ci === 1) return monoCell(val, colWidths[ci], { shading });
          return cell(val, colWidths[ci], { shading });
        }),
      });
    }),
  ];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: tableRows,
  });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, font: "Arial" })] });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120 },
    children: [new TextRun({ text, font: "Arial", size: 20, italics: opts.italics || false, color: opts.color || "000000" })],
  });
}

function sqlBlock(lines) {
  return lines.map(line => new Paragraph({
    spacing: { after: 0, line: 260 },
    children: [new TextRun({ text: line, font: "Consolas", size: 17, color: "1F4E79" })],
  }));
}

// Column widths: Name, Type, Description
const C = [2800, 2600, 3960];

// ============ DATA ============

const refTables = {
  "ReportConfigType": [
    ["ReportConfigTypeID", "INT (PK)", "1=Single Plan, 2=Multi Plan, 3=Combo, 4=Client Only"],
    ["Name", "NVARCHAR(50)", "Display name"],
  ],
  "PeriodType": [
    ["PeriodTypeID", "INT (PK)", "1=Quarterly, 2=Monthly"],
    ["Name", "NVARCHAR(20)", "Display name"],
  ],
  "ExhibitMenuType": [
    ["ExhibitMenuTypeID", "INT (PK)", "1-5: Single/Multi Plan Shared, Client Only variants"],
    ["Name", "NVARCHAR(50)", "Display name"],
  ],
  "BulkTierOverride": [
    ["BulkTierOverrideID", "INT (PK)", "Data availability window override"],
    ["Name", "NVARCHAR(50)", "e.g. Force Tier 1/2/3"],
    ["Description", "NVARCHAR(200)", "Explanation of tier behavior"],
  ],
  "BulkPctThreshold": [
    ["BulkPctThresholdID", "INT (PK)", "Manager data sufficiency threshold"],
    ["Name", "NVARCHAR(100)", "e.g. 50% / 80% of mgrs available"],
    ["Description", "NVARCHAR(200)", "Explanation"],
  ],
  "PageSetCategory": [
    ["PageSetCategoryID", "INT (PK)", "1-7 (Cat 8 retired)"],
    ["Name", "NVARCHAR(100)", "e.g. Core Shared, Single Plan Only, Multi Plan Only"],
  ],
};

const coreTables = {
  "Client": [
    ["AccountID", "UNIQUEIDENTIFIER (PK)", "Client account identifier"],
    ["Name", "NVARCHAR(200)", "Client name"],
  ],
  "Plan": [
    ["ct_PlanID", "INT (PK)", "Plan identifier"],
    ["AccountID", "UNIQUEIDENTIFIER (FK)", "References Client"],
    ["Name", "NVARCHAR(200)", "Plan name"],
    ["PlanType", "CHAR(2)", "DC, NQ, or DB"],
    ["Vendor", "NVARCHAR(100)", "Vanguard, Fidelity, TIAA, Schwab"],
    ["DefaultTier", "INT NULL", "Default data tier for plan"],
    ["DefaultConfigID", "INT NULL (FK)", "References ReportConfig \u2014 default shared config for this plan"],
  ],
  "Investment": [
    ["ct_investmentid", "INT (PK)", "Investment identifier"],
    ["ct_PlanID", "INT (FK)", "References Plan"],
    ["Ref", "NVARCHAR(200)", "Investment name/reference"],
    ["AssetClass", "NVARCHAR(100)", "Asset class classification"],
    ["SortOrder", "INT", "Display order within plan"],
  ],
  "PageSet": [
    ["PageSetID", "INT (PK)", "Exhibit page identifier"],
    ["Name", "NVARCHAR(200)", "Page/exhibit name"],
    ["PageSetCategoryID", "INT (FK)", "References PageSetCategory"],
    ["IsTab", "BIT", "Whether this is a tab exhibit"],
  ],
};

const exhibitTables = {
  "ExhibitTemplate": [
    ["ExhibitTemplateID", "INT IDENTITY (PK)", "Auto-incrementing ID"],
    ["ExhibitTemplateTypeID", "INT (FK)", "References ExhibitMenuType (1-5)"],
    ["Name", "NVARCHAR(200)", "Template name"],
    ["IndvAssetSummaries", "BIT", "Include individual asset summaries"],
    ["AccountID", "UNIQUEIDENTIFIER NULL (FK)", "NULL = CAPTRUST Shared; non-null = client-owned"],
    ["LastSavedBy", "NVARCHAR(100)", "User who last saved"],
    ["LastSaved", "DATETIME2", "Last save timestamp"],
  ],
  "ExhibitTemplatePageSet": [
    ["ExhibitTemplateID", "INT (FK, PK)", "References ExhibitTemplate"],
    ["PageSetID", "INT (FK, PK)", "References PageSet"],
    ["SortOrder", "INT", "Display order of exhibit in template"],
  ],
};

const configTables = {
  "ReportConfig": [
    ["ReportConfigID", "INT IDENTITY (PK)", "Auto-incrementing ID"],
    ["ReportConfigName", "NVARCHAR(200)", "Configuration name"],
    ["ReportConfigTypeID", "INT (FK)", "References ReportConfigType (1-4)"],
    ["IsPrimary", "BIT", "Primary config for its type/plan"],
    ["BulkRun", "BIT", "Include in bulk scheduling"],
    ["PeriodTypeID", "INT (FK)", "References PeriodType"],
    ["AccountID", "UNIQUEIDENTIFIER NULL (FK)", "NULL = CAPTRUST Shared; non-null = client-owned"],
    ["ct_PlanID", "INT NULL (FK)", "References Plan; NULL for multi/combo/shared"],
    ["ExhibitTemplateID", "INT NULL (FK)", "References ExhibitTemplate"],
    ["BulkTierOverrideID", "INT NULL (FK)", "References BulkTierOverride"],
    ["BulkPctThresholdID", "INT NULL (FK)", "References BulkPctThreshold"],
    ["QDIACheckOptOut", "BIT", "Opt out of QDIA compliance check"],
    ["CandidateInvestments", "BIT", "Include candidate investments in report"],
    ["IncludeFundChanges", "BIT", "Track fund changes"],
    ["OptInAllFundChanges", "BIT", "Auto-include all fund changes"],
    ["ParentReportConfigID", "INT NULL (FK)", "Self-ref: parent config for ad-hoc runs"],
    ["UserID", "NVARCHAR(100)", "User who created/last saved"],
    ["LastSaved", "DATETIME2", "Last save timestamp"],
  ],
};

const fundChangeTables = {
  "FundChange": [
    ["FundChangeID", "INT IDENTITY (PK)", "Auto-incrementing ID"],
    ["ct_PlanID", "INT (FK)", "References Plan"],
    ["ChangeType", "VARCHAR(20)", "InProgress or Executed"],
    ["CurrentInvestment", "NVARCHAR(200)", "Current investment name"],
    ["ReplacementInvestment", "NVARCHAR(200) NULL", "Replacement investment name"],
    ["Percentage", "DECIMAL(5,2)", "Percent being changed (default 100)"],
    ["EffectiveDate", "DATE NULL", "When change takes effect"],
  ],
  "ReportConfigFundChange": [
    ["ReportConfigID", "INT (FK, PK)", "References ReportConfig"],
    ["FundChangeID", "INT (FK, PK)", "References FundChange"],
    ["Included", "BIT", "Whether included in this config\u2019s report"],
  ],
};

const multiPlanTables = {
  "ReportPlanGroup": [
    ["ReportPlanGroupID", "INT IDENTITY (PK)", "Auto-incrementing ID"],
    ["ReportPlanGroupName", "NVARCHAR(200)", "Group name"],
    ["AccountID", "UNIQUEIDENTIFIER (FK)", "References Client"],
  ],
  "ReportConfigPlan": [
    ["PairingID", "INT IDENTITY (PK)", "Auto-incrementing ID"],
    ["ReportPlanGroupID", "INT (FK)", "References ReportPlanGroup"],
    ["ct_PlanID", "INT (FK)", "References Plan"],
  ],
};

const comboTables = {
  "ComboConfigChild": [
    ["ComboReportConfigID", "INT (FK, PK)", "Parent combo config"],
    ["ChildReportConfigID", "INT (FK, PK)", "Child single/multi config"],
  ],
};

const investmentMgmtTables = {
  "ManagerOrderCustomized": [
    ["ID", "INT IDENTITY (PK)", "Auto-incrementing ID"],
    ["ReportConfigID", "INT (FK)", "References ReportConfig"],
    ["ct_investmentid", "INT (FK)", "References Investment"],
    ["SortOrder", "INT", "Custom sort order"],
    ["GroupName", "NVARCHAR(100)", "Manager group/category"],
    ["AssetClass", "NVARCHAR(100)", "Asset class override"],
  ],
  "ReportConfigCandidateInvmt": [
    ["ID", "INT IDENTITY (PK)", "Auto-incrementing ID"],
    ["ReportConfigID", "INT (FK)", "References ReportConfig"],
    ["ct_investmentid", "INT (FK)", "References Investment (candidate)"],
  ],
};

function renderSection(title, description, tables) {
  const children = [
    heading(title, HeadingLevel.HEADING_2),
    para(description, { italics: true, color: "595959" }),
  ];
  for (const [name, rows] of Object.entries(tables)) {
    children.push(
      new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: name, font: "Consolas", size: 24, bold: true, color: "1F4E79" })] }),
      makeTable(["Column", "Type", "Description"], rows, C),
      new Paragraph({ spacing: { after: 80 }, children: [] }),
    );
  }
  return children;
}

// SQL DDL
const sqlDDL = `-- =============================================
-- IRP Report Configuration Database Schema
-- SQL Server DDL
-- Generated: ${new Date().toISOString().slice(0, 10)}
-- =============================================

-- Reference Tables
CREATE TABLE ReportConfigType (
    ReportConfigTypeID INT PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL
);

CREATE TABLE PeriodType (
    PeriodTypeID INT PRIMARY KEY,
    Name NVARCHAR(20) NOT NULL
);

CREATE TABLE ExhibitMenuType (
    ExhibitMenuTypeID INT PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL
);

CREATE TABLE BulkTierOverride (
    BulkTierOverrideID INT PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Description NVARCHAR(200)
);

CREATE TABLE BulkPctThreshold (
    BulkPctThresholdID INT PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(200)
);

CREATE TABLE PageSetCategory (
    PageSetCategoryID INT PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
);

-- Core Entities
CREATE TABLE Client (
    AccountID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(200) NOT NULL
);

CREATE TABLE [Plan] (
    ct_PlanID INT PRIMARY KEY,
    AccountID UNIQUEIDENTIFIER NOT NULL
        REFERENCES Client(AccountID),
    Name NVARCHAR(200) NOT NULL,
    PlanType CHAR(2) NOT NULL
        CHECK (PlanType IN ('DC','NQ','DB')),
    Vendor NVARCHAR(100),
    DefaultTier INT,
    DefaultConfigID INT NULL
    -- FK added after ReportConfig created
);

CREATE TABLE Investment (
    ct_investmentid INT PRIMARY KEY,
    ct_PlanID INT NOT NULL
        REFERENCES [Plan](ct_PlanID),
    Ref NVARCHAR(200) NOT NULL,
    AssetClass NVARCHAR(100),
    SortOrder INT NOT NULL DEFAULT 0
);

CREATE TABLE PageSet (
    PageSetID INT PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    PageSetCategoryID INT NOT NULL
        REFERENCES PageSetCategory(PageSetCategoryID),
    IsTab BIT NOT NULL DEFAULT 0
);

-- Exhibit Templates
CREATE TABLE ExhibitTemplate (
    ExhibitTemplateID INT IDENTITY PRIMARY KEY,
    ExhibitTemplateTypeID INT NOT NULL
        REFERENCES ExhibitMenuType(ExhibitMenuTypeID),
    Name NVARCHAR(200) NOT NULL,
    IndvAssetSummaries BIT NOT NULL DEFAULT 0,
    AccountID UNIQUEIDENTIFIER NULL
        REFERENCES Client(AccountID),
    -- NULL = CAPTRUST Shared
    LastSavedBy NVARCHAR(100),
    LastSaved DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE ExhibitTemplatePageSet (
    ExhibitTemplateID INT NOT NULL
        REFERENCES ExhibitTemplate(ExhibitTemplateID),
    PageSetID INT NOT NULL
        REFERENCES PageSet(PageSetID),
    SortOrder INT NOT NULL DEFAULT 0,
    PRIMARY KEY (ExhibitTemplateID, PageSetID)
);

-- Report Configuration
CREATE TABLE ReportConfig (
    ReportConfigID INT IDENTITY PRIMARY KEY,
    ReportConfigName NVARCHAR(200) NOT NULL,
    ReportConfigTypeID INT NOT NULL
        REFERENCES ReportConfigType(ReportConfigTypeID),
    IsPrimary BIT NOT NULL DEFAULT 0,
    BulkRun BIT NOT NULL DEFAULT 0,
    PeriodTypeID INT NOT NULL
        REFERENCES PeriodType(PeriodTypeID),
    AccountID UNIQUEIDENTIFIER NULL
        REFERENCES Client(AccountID),
    -- NULL = CAPTRUST Shared
    ct_PlanID INT NULL
        REFERENCES [Plan](ct_PlanID),
    ExhibitTemplateID INT NULL
        REFERENCES ExhibitTemplate(ExhibitTemplateID),
    BulkTierOverrideID INT NULL
        REFERENCES BulkTierOverride(BulkTierOverrideID),
    BulkPctThresholdID INT NULL
        REFERENCES BulkPctThreshold(BulkPctThresholdID),
    QDIACheckOptOut BIT NOT NULL DEFAULT 0,
    CandidateInvestments BIT NOT NULL DEFAULT 0,
    IncludeFundChanges BIT NOT NULL DEFAULT 1,
    OptInAllFundChanges BIT NOT NULL DEFAULT 0,
    ParentReportConfigID INT NULL
        REFERENCES ReportConfig(ReportConfigID),
    UserID NVARCHAR(100) NOT NULL,
    LastSaved DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

ALTER TABLE [Plan] ADD CONSTRAINT FK_Plan_DefaultConfig
    FOREIGN KEY (DefaultConfigID)
    REFERENCES ReportConfig(ReportConfigID);

-- Fund Changes
CREATE TABLE FundChange (
    FundChangeID INT IDENTITY PRIMARY KEY,
    ct_PlanID INT NOT NULL
        REFERENCES [Plan](ct_PlanID),
    ChangeType VARCHAR(20) NOT NULL
        CHECK (ChangeType IN ('InProgress','Executed')),
    CurrentInvestment NVARCHAR(200) NOT NULL,
    ReplacementInvestment NVARCHAR(200),
    Percentage DECIMAL(5,2) NOT NULL DEFAULT 100,
    EffectiveDate DATE NULL
);

CREATE TABLE ReportConfigFundChange (
    ReportConfigID INT NOT NULL
        REFERENCES ReportConfig(ReportConfigID),
    FundChangeID INT NOT NULL
        REFERENCES FundChange(FundChangeID),
    Included BIT NOT NULL DEFAULT 1,
    PRIMARY KEY (ReportConfigID, FundChangeID)
);

-- Multi-Plan Groups
CREATE TABLE ReportPlanGroup (
    ReportPlanGroupID INT IDENTITY PRIMARY KEY,
    ReportPlanGroupName NVARCHAR(200) NOT NULL,
    AccountID UNIQUEIDENTIFIER NOT NULL
        REFERENCES Client(AccountID)
);

CREATE TABLE ReportConfigPlan (
    PairingID INT IDENTITY PRIMARY KEY,
    ReportPlanGroupID INT NOT NULL
        REFERENCES ReportPlanGroup(ReportPlanGroupID),
    ct_PlanID INT NOT NULL
        REFERENCES [Plan](ct_PlanID)
);

-- Combo Configuration
CREATE TABLE ComboConfigChild (
    ComboReportConfigID INT NOT NULL
        REFERENCES ReportConfig(ReportConfigID),
    ChildReportConfigID INT NOT NULL
        REFERENCES ReportConfig(ReportConfigID),
    PRIMARY KEY (ComboReportConfigID, ChildReportConfigID)
);

-- Investment Management
CREATE TABLE ManagerOrderCustomized (
    ID INT IDENTITY PRIMARY KEY,
    ReportConfigID INT NOT NULL
        REFERENCES ReportConfig(ReportConfigID),
    ct_investmentid INT NOT NULL
        REFERENCES Investment(ct_investmentid),
    SortOrder INT NOT NULL,
    GroupName NVARCHAR(100),
    AssetClass NVARCHAR(100)
);

CREATE TABLE ReportConfigCandidateInvmt (
    ID INT IDENTITY PRIMARY KEY,
    ReportConfigID INT NOT NULL
        REFERENCES ReportConfig(ReportConfigID),
    ct_investmentid INT NOT NULL
        REFERENCES Investment(ct_investmentid)
);`.split("\n");

// ============ BUILD DOCUMENT ============

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
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
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
            new TextRun({ text: "Institutional Reporting Platform \u2014 Database Schema", font: "Arial", size: 18, color: "808080" }),
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
      // Title page content
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Institutional Reporting Platform", font: "Arial", size: 48, bold: true, color: "1F4E79" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "Database Schema Specification", font: "Arial", size: 36, color: "2E75B6" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "Report Configuration Module", font: "Arial", size: 28, color: "808080" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Version 1.1.0  \u2014  ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, font: "Arial", size: 22, color: "595959" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "CAPTRUST Financial Advisors", font: "Arial", size: 22, color: "595959" })],
      }),

      // Page break
      new Paragraph({ children: [new PageBreak()] }),

      // Table of Contents placeholder
      heading("Table of Contents"),
      para("1. Overview"),
      para("2. Reference Tables"),
      para("3. Core Entities"),
      para("4. Exhibit Templates"),
      para("5. Report Configuration"),
      para("6. Fund Changes"),
      para("7. Multi-Plan Groups"),
      para("8. Combo Configuration"),
      para("9. Investment Management"),
      para("10. Entity Relationship Summary"),
      para("11. Key Design Patterns"),
      para("12. SQL Server DDL"),

      new Paragraph({ children: [new PageBreak()] }),

      // 1. Overview
      heading("1. Overview"),
      para("This document defines the database schema for the CAPTRUST Institutional Reporting Platform (IRP) Report Configuration module. It covers all entities used to manage report configurations, exhibit templates, investment selections, fund changes, and plan groupings."),
      para("The schema supports single-plan, multi-plan, and combo report types with both client-specific and CAPTRUST-wide shared configurations. The key architectural pattern is that AccountID = NULL indicates a CAPTRUST-wide shared resource visible to all clients, while a non-null AccountID scopes the resource to a specific client."),

      new Paragraph({ children: [new PageBreak()] }),

      // 2. Reference Tables
      ...renderSection("2. Reference Tables", "Lookup/enumeration tables that define valid values for foreign key references throughout the schema.", refTables),

      new Paragraph({ children: [new PageBreak()] }),

      // 3. Core Entities
      ...renderSection("3. Core Entities", "Primary business objects: clients, plans, investments, and exhibit page definitions.", coreTables),

      new Paragraph({ children: [new PageBreak()] }),

      // 4. Exhibit Templates
      ...renderSection("4. Exhibit Templates", "Exhibit templates define which pages/exhibits appear in a report. Templates can be shared across all clients (AccountID = NULL) or owned by a specific client.", exhibitTables),

      new Paragraph({ children: [new PageBreak()] }),

      // 5. Report Configuration
      ...renderSection("5. Report Configuration", "The central configuration entity that ties together exhibit templates, plan selections, bulk run settings, QDIA compliance, candidate investments, and fund change tracking.", configTables),

      new Paragraph({ children: [new PageBreak()] }),

      // 6. Fund Changes
      ...renderSection("6. Fund Changes", "Tracks in-progress and executed fund/investment changes at the plan level. The junction table ReportConfigFundChange determines which changes are included in each report configuration.", fundChangeTables),

      // 7. Multi-Plan Groups
      ...renderSection("7. Multi-Plan Groups", "Plan groups allow multiple plans to be bundled into a single multi-plan report configuration.", multiPlanTables),

      new Paragraph({ children: [new PageBreak()] }),

      // 8. Combo Configuration
      ...renderSection("8. Combo Configuration", "Combo configs combine multiple single-plan and/or multi-plan report configurations into a single output.", comboTables),

      // 9. Investment Management
      ...renderSection("9. Investment Management", "Custom investment ordering and candidate investment selections per report configuration.", investmentMgmtTables),

      new Paragraph({ children: [new PageBreak()] }),

      // 10. Entity Relationship Summary
      heading("10. Entity Relationship Summary"),
      para("Key relationships between entities:"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Client \u2192 Plan (1:many via AccountID)", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Plan \u2192 Investment (1:many via ct_PlanID)", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "ReportConfig \u2192 ExhibitTemplate (many:1 via ExhibitTemplateID)", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "ExhibitTemplate \u2194 PageSet (many:many via ExhibitTemplatePageSet)", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "ReportConfig \u2192 Plan (optional, via ct_PlanID for single-plan configs)", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "ReportConfig \u2194 FundChange (many:many via ReportConfigFundChange)", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "ReportPlanGroup \u2194 Plan (many:many via ReportConfigPlan)", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "ComboConfigChild links parent combo \u2192 child single/multi configs", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Plan.DefaultConfigID \u2192 ReportConfig (default shared config assignment)", font: "Arial", size: 20 })] }),

      new Paragraph({ children: [new PageBreak()] }),

      // 11. Key Design Patterns
      heading("11. Key Design Patterns"),

      heading("Shared vs Client-Owned Resources", HeadingLevel.HEADING_3),
      para("Both ReportConfig and ExhibitTemplate use AccountID to control visibility:"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "AccountID = NULL \u2192 CAPTRUST Shared \u2014 visible to all clients, modifiable only by template administrators", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "AccountID = [value] \u2192 Client-owned \u2014 visible only to that client, modifiable by any user with access", font: "Arial", size: 20 })] }),

      heading("Config Association vs Modification", HeadingLevel.HEADING_3),
      para("Plans can be associated with a shared config without modifying the config itself. This is tracked via the Plan.DefaultConfigID foreign key. When saving, users have two options for shared configs:"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Save Association \u2014 links the plan to the shared config (updates Plan.DefaultConfigID only)", font: "Arial", size: 20 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Save Association & Update Config \u2014 links the plan AND modifies the shared config (admin only)", font: "Arial", size: 20 })] }),

      heading("Client-Shared Config Impact", HeadingLevel.HEADING_3),
      para("When a client-level config (non-null AccountID) is used by multiple plans within the same client, saving changes displays an impact warning showing how many other plans will be affected."),

      heading("Ad-Hoc Runs", HeadingLevel.HEADING_3),
      para("Ad-hoc report runs create a child ReportConfig with ParentReportConfigID referencing the source config. This preserves the exact state used for that run without modifying the parent."),

      heading("Fund Change Normalization", HeadingLevel.HEADING_3),
      para("In the prototype, fund change selections are stored as JSON objects (FundChangesInProgress, FundChangesExecuted) on ReportConfig. In the SQL schema, these are normalized into the ReportConfigFundChange junction table for proper relational integrity."),

      new Paragraph({ children: [new PageBreak()] }),

      // 12. SQL DDL
      heading("12. SQL Server DDL"),
      para("Complete CREATE TABLE statements for SQL Server implementation:"),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      ...sqlBlock(sqlDDL),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("J:\\Git\\report-config-ui\\docs\\IRP-Database-Schema.docx", buffer);
  console.log("Document created: J:\\Git\\report-config-ui\\docs\\IRP-Database-Schema.docx");
});
