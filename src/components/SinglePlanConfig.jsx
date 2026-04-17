import { Checkbox, Alert, message } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { fundChangesInProgress, fundChangesExecuted } from '../data/mockData';
import { resolveManagerGroups } from '../data/dataResolvers';
import FundChangesSection from './FundChangesSection';
import ManagerGroupsSection from './ManagerGroupsSection';
import ExhibitMenuSection from './ExhibitMenuSection';
import BulkRunSection from './BulkRunSection';
import SaveConfigSection from './SaveConfigSection';

// Default empty manager groups (no config loaded)
const emptyManagerGroups = [
  { id: 'group-default-1', name: 'Group 1', customName: 'Fixed Income', managers: [] },
  { id: 'group-default-2', name: 'Group 2', customName: 'Target Date Funds', managers: [] },
  { id: 'group-default-3', name: 'Group 3', customName: 'Core Equity', managers: [] },
];

export default function SinglePlanConfig({ plan, period, loadedConfig, onSaveConfig, currentPrimaryName, activeConfigName, activeConfigId, savedConfigRecord, allTemplates, allConfigs, onSaveTemplate, onUpdateTemplate, onRenameTemplate, onDeleteTemplate, clientAccountId, planFundChanges, planInvestments = [], allCandidates = [], isTemplateAdmin = false, allPlans = [], otherPlansUsingConfig = [], exhibitImages = {}, exhibitHeaders = {} }) {
  // --- All config state lives here ---
  const lastToastedConfigRef = useRef(null);
  const [qdiaOptOut, setQdiaOptOut] = useState(false);

  // Fund changes — default to unchecked when no config is loaded
  const [includeFundChanges, setIncludeFundChanges] = useState(false);
  const [optInAllFundChanges, setOptInAllFundChanges] = useState(false);
  const fcInProgress = planFundChanges?.inProgress?.length > 0 ? planFundChanges.inProgress : fundChangesInProgress;
  const fcExecuted = planFundChanges?.executed?.length > 0 ? planFundChanges.executed : fundChangesExecuted;
  const [inProgressChecks, setInProgressChecks] = useState(
    Object.fromEntries(fcInProgress.map(f => [f.id, false]))
  );
  const [executedChecks, setExecutedChecks] = useState(
    Object.fromEntries(fcExecuted.map(f => [f.id, false]))
  );

  // Managers
  const [includeCandidates, setIncludeCandidates] = useState(false);
  const [managerGroups, setManagerGroups] = useState(emptyManagerGroups);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());

  // Exhibits
  const [selectedExhibitIds, setSelectedExhibitIds] = useState([]);
  const [exhibitTemplateName, setExhibitTemplateName] = useState(null);
  const [exhibitTemplateId, setExhibitTemplateId] = useState(null);
  const [exhibitCategoryId, setExhibitCategoryId] = useState(1);

  // Bulk run
  const [includeInBulk, setIncludeInBulk] = useState(true);
  const [bulkUnlocked, setBulkUnlocked] = useState(false);
  const [bulkTierOverrideId, setBulkTierOverrideId] = useState(null);
  const [bulkPctThresholdId, setBulkPctThresholdId] = useState(null);

  // --- Load saved config state ---
  useEffect(() => {
    if (!loadedConfig) return;
    // Guard: ignore loadedConfig that was built for a different config type (e.g. leftover from plan groups)
    if (loadedConfig.configType && loadedConfig.configType !== 'single') return;
    setQdiaOptOut(loadedConfig.qdiaOptOut ?? loadedConfig.QDIACheckOptOut ?? false);
    setIncludeFundChanges(loadedConfig.includeFundChanges ?? true);
    setOptInAllFundChanges(loadedConfig.optInAllFundChanges ?? false);
    setInProgressChecks(loadedConfig.fundChangesInProgressChecks ??
      Object.fromEntries(fcInProgress.map(f => [f.id, f.included]))
    );
    setExecutedChecks(loadedConfig.fundChangesExecutedChecks ??
      Object.fromEntries(fcExecuted.map(f => [f.id, f.included]))
    );
    setIncludeCandidates(loadedConfig.includeCandidates ?? loadedConfig.CandidateInvestments ?? false);
    setManagerGroups(loadedConfig.managerGroups ?? emptyManagerGroups);
    setSelectedExhibitIds(loadedConfig.selectedExhibitIds ?? []);
    setExhibitTemplateName(loadedConfig.exhibitTemplateName ?? null);
    setExhibitTemplateId(loadedConfig.exhibitTemplate?.ExhibitTemplateID ?? null);
    setExhibitCategoryId(loadedConfig.exhibitCategoryId ?? 1);
    setIncludeInBulk(loadedConfig.includeInBulk ?? loadedConfig.BulkRun ?? true);
    setBulkUnlocked(loadedConfig.bulkUnlocked ?? (loadedConfig.BulkTierOverrideID != null || loadedConfig.BulkPctThresholdID != null));
    setBulkTierOverrideId(loadedConfig.bulkTierOverrideId ?? loadedConfig.BulkTierOverrideID ?? null);
    setBulkPctThresholdId(loadedConfig.bulkPctThresholdId ?? loadedConfig.BulkPctThresholdID ?? null);
    const toastKey = loadedConfig.ReportConfigID || loadedConfig._loadTimestamp || JSON.stringify(loadedConfig);
    if (!loadedConfig._autoLoad && !loadedConfig._defaultConfig && lastToastedConfigRef.current !== toastKey) {
      lastToastedConfigRef.current = toastKey;
      const parts = ['Report configuration'];
      if (loadedConfig.exhibitTemplateName) parts.push(`exhibit template "${loadedConfig.exhibitTemplateName}"`);
      message.success(`${parts.join(' and ')} loaded`);
    }
  }, [loadedConfig]);

  if (!plan) {
    return (
      <Alert
        type="info"
        showIcon
        message="Select a plan from the dropdown above to configure its report."
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <div>
      {/* Plan Banner */}
      <div style={{
        background: '#edf6fb',
        border: '1px solid #5FB4E5',
        borderRadius: 8,
        padding: '12px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{plan.name}</div>
          <div style={{ fontSize: 12, color: '#00437B' }}>
            Type: {plan.type} &bull; Vendor: {plan.vendor} &bull; Period: {period === 'Q' ? 'Quarterly' : 'Monthly'}
          </div>
        </div>
      </div>

      {/* --- Included Investments Group --- */}
      <div style={{ borderLeft: '3px solid #00437B', paddingLeft: 16, marginBottom: 8, marginTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00437B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Included Investments
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
          Control which investments appear in the report
        </div>
        <FundChangesSection
          includeFundChanges={includeFundChanges}
          setIncludeFundChanges={setIncludeFundChanges}
          optInAll={optInAllFundChanges}
          setOptInAll={setOptInAllFundChanges}
          inProgressChecks={inProgressChecks}
          setInProgressChecks={setInProgressChecks}
          executedChecks={executedChecks}
          setExecutedChecks={setExecutedChecks}
          fundChangesInProgressData={planFundChanges?.inProgress}
          fundChangesExecutedData={planFundChanges?.executed}
        />

        {/* TODO: Re-enable Asset Class | Managers section when candidate investment workflow is finalized
        <ManagerGroupsSection
          includeCandidates={includeCandidates}
          setIncludeCandidates={setIncludeCandidates}
          groups={managerGroups}
          setGroups={setManagerGroups}
          planInvestments={planInvestments}
          allCandidates={allCandidates}
          selectedCandidateIds={selectedCandidateIds}
          setSelectedCandidateIds={setSelectedCandidateIds}
          plans={plan ? [plan] : []}
        />
        */}
      </div>

      {/* --- Content Group --- */}
      <div style={{ borderLeft: '3px solid #3465CD', paddingLeft: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#3465CD', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Content
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
          Select the exhibits and pages included in the report output
        </div>
      <ExhibitMenuSection
        configType="single"
        selectedExhibitIds={selectedExhibitIds}
        setSelectedExhibitIds={setSelectedExhibitIds}
        exhibitTemplateName={exhibitTemplateName}
        setExhibitTemplateName={setExhibitTemplateName}
        exhibitTemplateId={exhibitTemplateId}
        setExhibitTemplateId={setExhibitTemplateId}
        categoryId={exhibitCategoryId}
        setCategoryId={setExhibitCategoryId}
        allTemplates={allTemplates}
        allConfigs={allConfigs}
        onSaveTemplate={onSaveTemplate}
        onUpdateTemplate={onUpdateTemplate}
        onRenameTemplate={onRenameTemplate}
        onDeleteTemplate={onDeleteTemplate}
        clientAccountId={clientAccountId}
        isTemplateAdmin={isTemplateAdmin}
        exhibitImages={exhibitImages}
        exhibitHeaders={exhibitHeaders}
      />
      </div>

      {/* --- Scheduling Group --- */}
      <div style={{ borderLeft: '3px solid #5FB4E5', paddingLeft: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#5FB4E5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Scheduling
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
          When and how this report is generated in the bulk run process
        </div>
        <BulkRunSection
          includeInBulk={includeInBulk}
          setIncludeInBulk={setIncludeInBulk}
          unlocked={bulkUnlocked}
          setUnlocked={setBulkUnlocked}
          selectedTierOverride={bulkTierOverrideId}
          setSelectedTierOverride={setBulkTierOverrideId}
          selectedPctThreshold={bulkPctThresholdId}
          setSelectedPctThreshold={setBulkPctThresholdId}
        />
      </div>

      <SaveConfigSection
        configType="single"
        qdiaOptOut={qdiaOptOut}
        setQdiaOptOut={setQdiaOptOut}
        reportPlans={plan ? [{ ...plan, investments: planInvestments, fundChanges: { inProgress: (planFundChanges?.inProgress || []).filter(fc => inProgressChecks[fc.id]), executed: (planFundChanges?.executed || []).filter(fc => executedChecks[fc.id]) }, candidates: includeCandidates ? allCandidates.filter(c => c.replacesRef && planInvestments.some(inv => inv.Ref === c.replacesRef)).filter(c => selectedCandidateIds.has(c.ct_investmentid)) : [] }] : []}
        onSaveConfig={(args) => onSaveConfig && onSaveConfig({
          ...args,
          ExhibitTemplateID: exhibitTemplateId,
          BulkRun: includeInBulk,
          BulkTierOverrideID: bulkUnlocked ? bulkTierOverrideId : null,
          BulkPctThresholdID: bulkUnlocked ? bulkPctThresholdId : null,
          QDIACheckOptOut: qdiaOptOut,
          CandidateInvestments: includeCandidates,
          IncludeFundChanges: includeFundChanges,
          OptInAllFundChanges: optInAllFundChanges,
          FundChangesInProgress: { ...inProgressChecks },
          FundChangesExecuted: { ...executedChecks },
        })}
        currentPrimaryName={currentPrimaryName}
        activeConfigName={activeConfigName}
        activeConfigId={activeConfigId}
        savedConfigRecord={savedConfigRecord}
        allTemplates={allTemplates}
        isTemplateAdmin={isTemplateAdmin}
        allPlans={allPlans}
        otherPlansUsingConfig={otherPlansUsingConfig}
        exhibitHeaders={exhibitHeaders}
        liveState={{
          BulkRun: includeInBulk,
          BulkTierOverrideID: bulkUnlocked ? bulkTierOverrideId : null,
          BulkPctThresholdID: bulkUnlocked ? bulkPctThresholdId : null,
          QDIACheckOptOut: qdiaOptOut,
          CandidateInvestments: includeCandidates,
          ExhibitTemplateID: exhibitTemplateId,
          IncludeFundChanges: includeFundChanges,
          OptInAllFundChanges: optInAllFundChanges,
          FundChangesInProgress: inProgressChecks,
          FundChangesExecuted: executedChecks,
        }}
      />
    </div>
  );
}
