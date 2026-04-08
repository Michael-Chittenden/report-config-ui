const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak,
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerShading = { fill: "1F4E79", type: ShadingType.CLEAR };
const altRowShading = { fill: "F2F7FB", type: ShadingType.CLEAR };
const catShading = { fill: "E8F0F8", type: ShadingType.CLEAR };
const cellMargins = { top: 50, bottom: 50, left: 80, right: 80 };
const CONTENT_WIDTH = 9360;

function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, shading: headerShading, margins: cellMargins, verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 18 })] })],
  });
}
function cell(text, width, opts = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, shading: opts.shading || undefined, margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: opts.mono ? "Consolas" : "Arial", size: 18, bold: opts.bold || false, color: opts.color || "000000" })] })],
  });
}
function catRow(text, colWidths) {
  return new TableRow({
    children: [
      new TableCell({
        borders, width: { size: colWidths[0], type: WidthType.DXA }, shading: catShading, margins: cellMargins, columnSpan: 5,
        children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20, bold: true, color: "1F4E79" })] })],
      }),
    ],
  });
}

// Import pageset data
const categories = [
  { id: 1, name: "Core Shared Pages (Client Level)" },
  { id: 2, name: "Single Plan" },
  { id: 6, name: "Single Plan with Liabilities" },
  { id: 3, name: "Multi Plan" },
  { id: 4, name: "COMBO (Client) \u2011 Specific Pages" },
  { id: 5, name: "Optional / Add\u2011On Pages" },
  { id: 7, name: "IM PARIs Reports" },
];

// prodId = original PageSetID from production database schema ("new" = added in prototype)
const pagesets = [
  // Core Shared
  { id: "ps-1", prodId: 4, name: "Title Page", categoryId: 1, isTab: false },
  { id: "ps-2", prodId: 6, name: "Table of Contents", categoryId: 1, isTab: false },
  { id: "ps-3", prodId: 16, name: "CAPTRUST Team Members", categoryId: 1, isTab: false },
  { id: "ps-5", prodId: 28, name: "Action Items", categoryId: 1, isTab: false },
  { id: "ps-6", prodId: 29, name: "Evaluation Methodology", categoryId: 1, isTab: false },
  { id: "ps-7", prodId: 38, name: "Fact Sheets", categoryId: 1, isTab: false },
  { id: "ps-10", prodId: 45, name: "TAB - Appendix", categoryId: 1, isTab: true },
  { id: "ps-11", prodId: 46, name: "TAB - Fund Fact Sheets", categoryId: 1, isTab: true },
  { id: "ps-12", prodId: 47, name: "TAB - Industry Updates", categoryId: 1, isTab: true },
  { id: "ps-13", prodId: 48, name: "TAB - Market Commentary", categoryId: 1, isTab: true },
  { id: "ps-14", prodId: 49, name: "TAB - Plan Investment Review", categoryId: 1, isTab: true },
  { id: "ps-15", prodId: 72, name: "Market Commentary", categoryId: 1, isTab: false },
  { id: "ps-16", prodId: 81, name: "TAB - Asset Investment Review", categoryId: 1, isTab: true },
  { id: "ps-17", prodId: 96, name: "DB Topical Spotlight", categoryId: 1, isTab: false },
  { id: "ps-18", prodId: 97, name: "DC Topical Spotlight", categoryId: 1, isTab: false },
  { id: "ps-19", prodId: 98, name: "NQ Topical Spotlight", categoryId: 1, isTab: false },
  { id: "ps-20", prodId: 103, name: "Action Items | Notes", categoryId: 1, isTab: false },
  { id: "ps-21", prodId: 109, name: "TAB - Executive Summary", categoryId: 1, isTab: true },
  { id: "ps-22", prodId: 110, name: "TAB - Due Diligence", categoryId: 1, isTab: true },
  { id: "ps-23", prodId: 111, name: "TAB - Manager Fact Sheets", categoryId: 1, isTab: true },
  { id: "ps-24", prodId: 152, name: "MAPS Current Allocations", categoryId: 1, isTab: false },
  { id: "ps-25", prodId: 165, name: "TAB - MAPS Managed Accounts Portfolio Review", categoryId: 1, isTab: true },
  { id: "ps-26", prodId: 196, name: "Market Commentary Short", categoryId: 1, isTab: false },
  { id: "ps-27", prodId: 203, name: "Internal Fee Benchmark", categoryId: 1, isTab: false },
  { id: "ps-28", prodId: 204, name: "Disclosure", categoryId: 1, isTab: false },
  { id: "ps-111", prodId: 115, name: "DB Summary and Recommendations", categoryId: 1, isTab: false },
  { id: "ps-112", prodId: 170, name: "DB Evaluation Methodology", categoryId: 1, isTab: false },
  // Single Plan
  { id: "ps-4", prodId: 19, name: "Investment Review | Select Commentary", categoryId: 2, isTab: false },
  { id: "ps-8", prodId: 42, name: "Investment Policy Monitor - Active", categoryId: 2, isTab: false },
  { id: "ps-9", prodId: 43, name: "Investment Policy Monitor - TDF, Passive", categoryId: 2, isTab: false },
  { id: "ps-30", prodId: 14, name: "Historical Fund Scores", categoryId: 2, isTab: false },
  { id: "ps-31", prodId: 15, name: "Historical Asset Valuation Summary", categoryId: 2, isTab: false },
  { id: "ps-34", prodId: 40, name: "Performance Summary", categoryId: 2, isTab: false },
  { id: "ps-35", prodId: 93, name: "Asset Valuation Summary", categoryId: 2, isTab: false },
  { id: "ps-36", prodId: 171, name: "DC Plan Information Summary", categoryId: 2, isTab: false },
  { id: "ps-37", prodId: 172, name: "DC Fee Comparison", categoryId: 2, isTab: false },
  { id: "ps-38", prodId: 173, name: "DC Fee Comparison Detail Grid", categoryId: 2, isTab: false },
  { id: "ps-39", prodId: 179, name: "Expense Analysis - Current", categoryId: 2, isTab: false },
  { id: "ps-40", prodId: 180, name: "Expense Analysis - Recommended", categoryId: 2, isTab: false },
  { id: "ps-41", prodId: 181, name: "Mapping Fund Additions", categoryId: 2, isTab: false },
  { id: "ps-42", prodId: 182, name: "Expense Comparison", categoryId: 2, isTab: false },
  { id: "ps-43", prodId: 193, name: "Investment Review | Select Commentary with Score", categoryId: 2, isTab: false },
  { id: "ps-44", prodId: 194, name: "Investment Expense Evaluation", categoryId: 2, isTab: false },
  { id: "ps-45", prodId: 195, name: "Investment Vehicle Evaluation", categoryId: 2, isTab: false },
  { id: "ps-46", prodId: 197, name: "Plan Design Review", categoryId: 2, isTab: false },
  { id: "ps-47", prodId: 199, name: "Exec Sum | Investment Detail", categoryId: 2, isTab: false },
  { id: "ps-48", prodId: 212, name: "Asset Plan Menu", categoryId: 2, isTab: false },
  { id: "ps-49", prodId: 301, name: "Plan Design - Summary of Key Plan Design Features", categoryId: 2, isTab: false },
  { id: "ps-50", prodId: 303, name: "Plan Design - Automatic Enrollment", categoryId: 2, isTab: false },
  { id: "ps-51", prodId: 304, name: "Plan Design - Automatic Escalation", categoryId: 2, isTab: false },
  { id: "ps-52", prodId: 305, name: "Plan Design - Qualified Default Investment Option", categoryId: 2, isTab: false },
  { id: "ps-53", prodId: 306, name: "Plan Design - Employer Contributions", categoryId: 2, isTab: false },
  { id: "ps-54", prodId: 307, name: "Plan Design - Loans", categoryId: 2, isTab: false },
  { id: "ps-55", prodId: 308, name: "Plan Design - Other Plan Features", categoryId: 2, isTab: false },
  { id: "ps-56", prodId: 309, name: "Plan Design - Secure 2.0", categoryId: 2, isTab: false },
  { id: "ps-110", prodId: 114, name: "DB Investment Policy Summary", categoryId: 2, isTab: false },
  // Single Plan with Liabilities
  { id: "ps-90", prodId: 55, name: "NQ Asset/Liability Summary Page", categoryId: 6, isTab: false },
  { id: "ps-91", prodId: 56, name: "NQ Liability Investment Policy Monitor", categoryId: 6, isTab: false },
  { id: "ps-94", prodId: 78, name: "NQ Historical Liability Valuation Summary", categoryId: 6, isTab: false },
  { id: "ps-95", prodId: 79, name: "TAB - NQ Plan Financing Review", categoryId: 6, isTab: true },
  { id: "ps-96", prodId: 80, name: "TAB - NQ Benefit Liability Investment Review", categoryId: 6, isTab: true },
  { id: "ps-97", prodId: 82, name: "NQ Hedging Strategy Review", categoryId: 6, isTab: false },
  { id: "ps-98", prodId: 91, name: "NQ Investment Policy Monitor - TDF, Passive", categoryId: 6, isTab: false },
  { id: "ps-99", prodId: 102, name: "NQ Liability Investment Select Commentary", categoryId: 6, isTab: false },
  { id: "ps-100", prodId: 105, name: "NQ Liability Valuation Summary", categoryId: 6, isTab: false },
  { id: "ps-101", prodId: 213, name: "NQ Liability Plan Menu", categoryId: 6, isTab: false },
  { id: "ps-215", prodId: 215, name: "NQ Mirror Asset Liability Scores", categoryId: 6, isTab: false },
  { id: "ps-216", prodId: 216, name: "NQ Mirror Liability Discussion Items", categoryId: 6, isTab: false },
  { id: "ps-217", prodId: 217, name: "NQ Mirror Asset Liability ScoresTargetDateSeries", categoryId: 6, isTab: false },
  { id: "ps-218", prodId: 218, name: "NQ Mirror Asset Liability Plan Menu", categoryId: 6, isTab: false },
  { id: "ps-219", prodId: 219, name: "NQ Mirror Asset Liability Performance Summary", categoryId: 6, isTab: false },
  // Multi Plan
  { id: "ps-60", prodId: 206, name: "Multi Asset Valuation Summary", categoryId: 3, isTab: false },
  { id: "ps-61", prodId: 207, name: "Multi Performance Summary", categoryId: 3, isTab: false },
  { id: "ps-62", prodId: 209, name: "Multi Investment Policy Monitor", categoryId: 3, isTab: false },
  { id: "ps-63", prodId: 210, name: "Multi Investment Policy Monitor - TDF, Passive", categoryId: 3, isTab: false },
  { id: "ps-64", prodId: 211, name: "Multi Investment Review | Select Commentary", categoryId: 3, isTab: false },
  { id: "ps-65", prodId: 214, name: "Multi Plan Menu", categoryId: 3, isTab: false },
  // COMBO
  { id: "ps-69", prodId: "new", name: "COMBO Title Page", categoryId: 4, isTab: false },
  { id: "ps-70", prodId: 185, name: "COMBO Fact Sheets", categoryId: 4, isTab: false },
  { id: "ps-71", prodId: 401, name: "At Work - Table of Contents", categoryId: 4, isTab: false },
  { id: "ps-72", prodId: 402, name: "At Work - Goals and Objectives", categoryId: 4, isTab: false },
  { id: "ps-73", prodId: 403, name: "At Work - Participant Communication and Advice Access", categoryId: 4, isTab: false },
  { id: "ps-74", prodId: 404, name: "At Work - Retirement Blueprint Results", categoryId: 4, isTab: false },
  { id: "ps-75", prodId: 405, name: "At Work - Employee Survey Results", categoryId: 4, isTab: false },
  { id: "ps-76", prodId: 406, name: "At Work - Employee Interactions", categoryId: 4, isTab: false },
  { id: "ps-77", prodId: 407, name: "At Work - Wellness Content", categoryId: 4, isTab: false },
  { id: "ps-78", prodId: 408, name: "At Work - Communications to Employees", categoryId: 4, isTab: false },
  { id: "ps-79", prodId: 409, name: "At Work - Employee Engagement Strategies", categoryId: 4, isTab: false },
  { id: "ps-80", prodId: 410, name: "At Work - Participant Engagement Calendar", categoryId: 4, isTab: false },
  { id: "ps-81", prodId: 411, name: "At Work - Action Items and Reminders", categoryId: 4, isTab: false },
  // IM PARIs Reports
  { id: "ps-113", prodId: 200, name: "PARis Performance Book - Plan 1", categoryId: 7, isTab: false },
  { id: "ps-120", prodId: "new", name: "PARis Performance Book - Plan 2", categoryId: 7, isTab: false },
  { id: "ps-121", prodId: "new", name: "PARis Performance Book - Plan 3", categoryId: 7, isTab: false },
  { id: "ps-122", prodId: "new", name: "PARis Performance Book - Plan 4", categoryId: 7, isTab: false },
];

const C = [1000, 1000, 4160, 1200, 1000];

const rows = [];
for (const cat of categories) {
  rows.push(catRow(`${cat.name} (Category ${cat.id})`, C));
  const items = pagesets.filter(p => p.categoryId === cat.id).sort((a, b) => a.name.localeCompare(b.name));
  items.forEach((p, i) => {
    const shading = i % 2 === 1 ? altRowShading : undefined;
    rows.push(new TableRow({
      children: [
        cell(String(p.prodId), C[0], { mono: true, shading, bold: true, color: "1F4E79" }),
        cell(p.id, C[1], { mono: true, shading, color: "808080" }),
        cell(p.name, C[2], { shading }),
        cell(cat.name, C[3], { shading, color: "808080" }),
        cell(p.isTab ? "Yes" : "No", C[4], { shading, color: p.isTab ? "1F4E79" : "808080", bold: p.isTab }),
      ],
    }));
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
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
          new TextRun({ text: "IRP Pageset Reference", font: "Arial", size: 18, color: "808080" }),
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
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "IRP Pageset Reference", font: "Arial" })] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}  \u2014  ${pagesets.length} pagesets across ${categories.length} categories`, font: "Arial", size: 20, color: "595959", italics: true }),
      ]}),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: "All pageset values from the IRP Report Configuration module, grouped by category. Tab exhibits are marked in the IsTab column.", font: "Arial", size: 20, color: "595959" }),
      ]}),
      new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: C,
        rows: [
          new TableRow({ children: [headerCell("Prod ID", C[0]), headerCell("Prototype ID", C[1]), headerCell("Name", C[2]), headerCell("Category", C[3]), headerCell("IsTab", C[4])] }),
          ...rows,
        ],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("J:\\Git\\report-config-ui\\docs\\IRP-Pageset-Reference.docx", buffer);
  console.log("Document created: J:\\Git\\report-config-ui\\docs\\IRP-Pageset-Reference.docx");
});
