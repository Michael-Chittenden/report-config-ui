import { Checkbox, Alert, message } from 'antd';
import { useState, useEffect } from 'react';
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

export default function SinglePlanConfig({ plan, period, loadedConfig, onSaveConfig, currentPrimaryName, activeConfigName, activeConfigId, savedConfigRecord, allTemplates, allConfigs, onSaveTemplate, onUpdateTemplate, onRenameTemplate, onDeleteTemplate, clientAccountId, planFundChanges, planInvestments = [], allCandidates = [], isTemplateAdmin = false, allPlans = [], otherPlansUsingConfig = [] }) {
  // --- All config state lives here ---
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
    if (!loadedConfig._autoLoad && !loadedConfig._defaultConfig) {
      message.success('Configuration loaded');
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
        background: '#e6f4ff',
        border: '1px solid #91caff',
        borderRadius: 8,
        padding: '12px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{plan.name}</div>
          <div style={{ fontSize: 12, color: '#1677ff' }}>
            Type: {plan.type} &bull; Vendor: {plan.vendor} &bull; Period: {period === 'Q' ? 'Quarterly' : 'Monthly'}
          </div>
        </div>
      </div>

      {/* QDIA Opt-Out */}
      <div className="config-section">
        <div className="section-body" style={{ padding: '12px 20px' }}>
          <Checkbox
            checked={qdiaOptOut}
            onChange={(e) => setQdiaOptOut(e.target.checked)}
          >
            Opt out of QDIA checks
          </Checkbox>
          <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>
            (Uncheck to require QDIA assignment validation)
          </span>
        </div>
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
      />

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

      <SaveConfigSection
        configType="single"
        qdiaOptOut={qdiaOptOut}
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
