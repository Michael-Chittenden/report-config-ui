// ============================================================
// Data Resolvers — join normalized mock tables into UI-ready shapes
// Replaces savedStates.js
// ============================================================

import {
  reportConfigs,
  reportConfigTypes,
  periodTypes,
  exhibitTemplateConfigs,
  exhibitTemplatePageSets,
  exhibitMenuTypes,
  bulkTierOverrides,
  bulkPctThresholds,
  pagesets,
  demoPlans,
  managerOrderCustomized,
  reportConfigCandidateInvmts,
  reportPlanGroups,
  reportConfigPlans,
  comboConfigChildren,
  fundChangesInProgress,
  fundChangesExecuted,
} from './mockData';

// --- Resolve an ExhibitTemplateID to its ordered pageset IDs ---
export function resolveExhibitPageSetIds(templateId) {
  return exhibitTemplatePageSets
    .filter(ep => ep.ExhibitTemplateID === templateId)
    .sort((a, b) => a.Order - b.Order)
    .map(ep => ep.PageSetID);
}

// --- Resolve pageset IDs to full objects ---
export function resolveExhibitIds(ids) {
  return ids.map(id => pagesets.find(p => p.id === id)).filter(Boolean);
}

// --- Get exhibit template config by ID ---
export function getExhibitTemplate(templateId) {
  return exhibitTemplateConfigs.find(t => t.ExhibitTemplateID === templateId) || null;
}

// --- Get templates filtered by config type ---
// Returns { client: [...], shared: [...] }
export function getAvailableTemplates(configType) {
  // Map config type to shared and client-only ExhibitTemplateTypes
  const typeMap = {
    single: { shared: [1], clientOnly: [3] },
    multi: { shared: [2], clientOnly: [4] },
    combo: { shared: [], clientOnly: [5] },
  };
  const mapping = typeMap[configType] || { shared: [], clientOnly: [] };

  return {
    client: exhibitTemplateConfigs.filter(t => mapping.clientOnly.includes(t.ExhibitTemplateType)),
    shared: exhibitTemplateConfigs.filter(t => mapping.shared.includes(t.ExhibitTemplateType)),
  };
}

// --- Build manager groups from flat managerOrderCustomized rows ---
// Groups by GroupName, preserves order, marks candidates
export function resolveManagerGroups(configId) {
  const rows = managerOrderCustomized
    .filter(m => m.ReportConfigID === configId)
    .sort((a, b) => a.Order - b.Order);

  const candidates = new Set(
    reportConfigCandidateInvmts
      .filter(c => c.ReportConfigID === configId)
      .map(c => c.ct_investmentid)
  );

  const groupMap = new Map();
  let groupIndex = 0;
  for (const row of rows) {
    if (!groupMap.has(row.GroupName)) {
      groupIndex++;
      groupMap.set(row.GroupName, {
        id: `group-${configId}-${groupIndex}`,
        name: `Group ${groupIndex}`,
        customName: row.GroupName,
        managers: [],
      });
    }
    groupMap.get(row.GroupName).managers.push({
      id: `m-${row.ID}`,
      assetClass: row.AssetClass,
      fund: row.Ref,
      isCandidate: row.CandidateID != null || candidates.has(row.ct_investmentid),
    });
  }

  return Array.from(groupMap.values());
}

// --- Resolve a full ReportConfig into UI state ---
export function resolveReportConfig(configId) {
  const config = reportConfigs.find(c => c.ReportConfigID === configId);
  if (!config) return null;

  const template = config.ExhibitTemplateID ? getExhibitTemplate(config.ExhibitTemplateID) : null;
  const selectedExhibitIds = config.ExhibitTemplateID ? resolveExhibitPageSetIds(config.ExhibitTemplateID) : [];
  const managerGroups = resolveManagerGroups(configId);

  // Version lineage
  const parentConfig = config.ParentReportConfigID
    ? reportConfigs.find(c => c.ReportConfigID === config.ParentReportConfigID)
    : null;

  // Fund changes — use defaults (in production these come from DB per-config)
  const fundChangesInProgressChecks = Object.fromEntries(
    fundChangesInProgress.map(f => [f.id, config.QDIACheckOptOut ? false : f.included])
  );
  const fundChangesExecutedChecks = Object.fromEntries(
    fundChangesExecuted.map(f => [f.id, config.QDIACheckOptOut ? false : f.included])
  );

  // Map config type ID to string
  const configTypeMap = { 1: 'single', 2: 'multi', 3: 'combo', 4: 'clientOnly' };

  return {
    // Pass through DB fields
    ...config,

    // Resolved type strings
    configType: configTypeMap[config.ReportConfigType] || 'single',
    periodCode: config.PeriodType === 1 ? 'Q' : 'M',

    // Plan ID (for single plan — derived from manager data or first plan group)
    planId: resolvePlanIdForConfig(config),

    // Exhibit template
    exhibitTemplate: template,
    exhibitTemplateName: template ? template.Name : null,
    selectedExhibitIds,
    exhibitCategoryId: 1,

    // Managers
    managerGroups,
    includeCandidates: config.CandidateInvestments || false,

    // Fund changes
    includeFundChanges: !config.QDIACheckOptOut,
    optInAllFundChanges: false,
    fundChangesInProgressChecks,
    fundChangesExecutedChecks,

    // Bulk run
    includeInBulk: config.BulkRun || false,
    bulkUnlocked: config.BulkTierOverrideID != null || config.BulkPctThresholdID != null,
    bulkTierOverrideId: config.BulkTierOverrideID,
    bulkPctThresholdId: config.BulkPctThresholdID,

    // QDIA
    qdiaOptOut: config.QDIACheckOptOut || false,

    // Versioning
    parentConfigName: parentConfig ? parentConfig.ReportConfigName : null,

    // Plan groups (for multi)
    planGroups: reportPlanGroups
      .filter(g => g.ReportConfigID === configId)
      .map(g => ({
        ...g,
        plans: reportConfigPlans
          .filter(p => p.ReportPlanGroupID === g.ReportPlanGroupID)
          .map(p => demoPlans.find(dp => dp.ct_PlanID === p.ct_PlanID))
          .filter(Boolean),
      })),

    // Combo children
    childConfigs: comboConfigChildren
      .filter(c => c.ComboReportConfigID === configId)
      .map(c => reportConfigs.find(rc => rc.ReportConfigID === c.ReportConfigID))
      .filter(Boolean),
  };
}

// --- Helper: figure out which plan a single-plan config is for ---
function resolvePlanIdForConfig(config) {
  if (config.ReportConfigType !== 1) return null;

  // Use the config's explicit ct_PlanID if available
  if (config.ct_PlanID) return config.ct_PlanID;

  // Look at the manager data to infer the plan, or use name-based heuristic
  const name = config.ReportConfigName.toLowerCase();
  if (name.includes('nq plan 3')) return 1003;
  if (name.includes('db plan 4')) return 1004;
  if (name.includes('dc plan 2') || name.includes('plan 2')) return 1002;
  if (name.includes('dc plan 1') || name.includes('plan 1')) return 1001;
  // Fallback: "Everything" config uses DC Plan 2
  if (name.includes('everything')) return 1002;
  // Shared/template configs with no plan — return null so caller keeps current selection
  return null;
}

// --- Map user display name for UserID ---
export function resolveUserName(userId) {
  const map = {
    'jane.doe': 'Jane Doe',
    'john.smith': 'John Smith',
    'bob.johnson': 'Bob Johnson',
  };
  return map[userId] || userId;
}

// --- Get config type display name ---
export function getConfigTypeName(typeId) {
  return reportConfigTypes[typeId] || 'Unknown';
}

// --- Get bulk tier display name ---
export function getBulkTierName(tierId) {
  const tier = bulkTierOverrides.find(t => t.id === tierId);
  return tier ? tier.name : null;
}

// --- Get bulk pct threshold display name ---
export function getBulkPctName(pctId) {
  const pct = bulkPctThresholds.find(t => t.id === pctId);
  return pct ? pct.name : null;
}
