import { useState, useMemo } from 'react';
import { Button, Input, Modal, Select, Space, Alert, Checkbox, Tag, Table, Collapse, message } from 'antd';
import {
  SaveOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  StarFilled,
  ShareAltOutlined,
  LockOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  FileTextOutlined,
  TeamOutlined,
  ExperimentOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { bulkTierOverrides, bulkPctThresholds, pagesets } from '../data/mockData';
import { resolveExhibitPageSetIds } from '../data/dataResolvers';

// Human-readable labels for changed fields
function describeChange(field, oldVal, newVal, { templateLookup } = {}) {
  const boolLabel = (v) => v ? 'Yes' : 'No';
  const tierName = (id) => {
    if (id == null) return 'None';
    const t = bulkTierOverrides.find(x => x.id === id);
    return t ? t.name : `Tier ${id}`;
  };
  const pctName = (id) => {
    if (id == null) return 'None';
    const t = bulkPctThresholds.find(x => x.id === id);
    return t ? t.name : `${id}`;
  };
  const templateName = (id) => {
    if (id == null) return 'None';
    if (templateLookup) {
      const t = templateLookup.find(x => x.ExhibitTemplateID === id);
      if (t) return t.Name;
    }
    return `ID ${id}`;
  };

  const fundChangesSummary = (val) => {
    if (val == null) return 'Default';
    if (typeof val === 'object') {
      const total = Object.keys(val).length;
      const checked = Object.values(val).filter(Boolean).length;
      return `${checked} of ${total}`;
    }
    return String(val);
  };

  switch (field) {
    case 'BulkRun':
      return { label: 'Include in Bulk Run', from: boolLabel(oldVal), to: boolLabel(newVal) };
    case 'BulkTierOverrideID':
      return { label: 'Bulk Tier Override', from: tierName(oldVal), to: tierName(newVal) };
    case 'BulkPctThresholdID':
      return { label: 'Manager Data Threshold', from: pctName(oldVal), to: pctName(newVal) };
    case 'QDIACheckOptOut':
      return { label: 'QDIA Check Opt-Out', from: boolLabel(oldVal), to: boolLabel(newVal) };
    case 'CandidateInvestments':
      return { label: 'Candidate Investments', from: boolLabel(oldVal), to: boolLabel(newVal) };
    case 'ExhibitTemplateID':
      return { label: 'Exhibit Template', from: templateName(oldVal), to: templateName(newVal) };
    case 'IncludeFundChanges':
      return { label: 'Include Fund Changes', from: boolLabel(oldVal), to: boolLabel(newVal) };
    case 'OptInAllFundChanges':
      return { label: 'Opt In All Fund Changes', from: boolLabel(oldVal), to: boolLabel(newVal) };
    case 'FundChangesInProgress':
      return { label: 'Fund Changes In Progress', from: fundChangesSummary(oldVal), to: fundChangesSummary(newVal) };
    case 'FundChangesExecuted':
      return { label: 'Fund Changes Executed', from: fundChangesSummary(oldVal), to: fundChangesSummary(newVal) };
    default:
      return { label: field, from: String(oldVal), to: String(newVal) };
  }
}

export default function SaveConfigSection({
  configType = 'single',
  qdiaOptOut = false,
  onSaveConfig,
  currentPrimaryName,
  activeConfigName,
  activeConfigId,
  savedConfigRecord,
  liveState,
  allTemplates,
  planGroupChanged = false,
  planGroupName,
  reportPlans = [],
  isTemplateAdmin = false,
  allPlans = [],
  otherPlansUsingConfig = [],
  childConfigExhibits = [],
  exhibitHeaders = {},
  selectedHeaderMap = {},
}) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [runNowModalOpen, setRunNowModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [configName, setConfigName] = useState('');
  const [setAsPrimary, setSetAsPrimary] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState('2025-Q4');
  const [shareAsTemplate, setShareAsTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runAfterSave, setRunAfterSave] = useState(false);
  const [isSaveAs, setIsSaveAs] = useState(false);

  // Use the isTemplateAdmin prop from App.jsx (toggled via Demo Data admin)
  const canShareTemplates = isTemplateAdmin;

  const hasActiveConfig = !!activeConfigId;
  const hasExhibitTemplate = !!(liveState && liveState.ExhibitTemplateID);

  // Resolve exhibit pages for the current template
  const exhibitPages = useMemo(() => {
    if (!liveState?.ExhibitTemplateID) return [];
    // Check template._sessionIds first (user-saved), fall back to seed junction table
    const template = allTemplates?.find(t => t.ExhibitTemplateID === liveState.ExhibitTemplateID);
    const ids = template?._sessionIds?.length > 0
      ? template._sessionIds
      : resolveExhibitPageSetIds(liveState.ExhibitTemplateID);
    return ids.map(id => pagesets.find(p => p.id === id)).filter(Boolean);
  }, [liveState?.ExhibitTemplateID, allTemplates]);

  // Detect if the active config is a CAPTRUST-wide shared config (AccountID === null)
  const isSharedConfig = savedConfigRecord && (savedConfigRecord.AccountID === null || savedConfigRecord.AccountID === undefined);
  // Count how many plans use this shared config as their defaultConfigId
  const sharedConfigPlanCount = useMemo(() => {
    if (!isSharedConfig || !savedConfigRecord) return 0;
    return allPlans.filter(p => p.defaultConfigId === savedConfigRecord.ReportConfigID).length;
  }, [isSharedConfig, savedConfigRecord, allPlans]);

  // Detect if a client-level config is used by other plans in the same client
  const isClientSharedConfig = !isSharedConfig && otherPlansUsingConfig.length > 0;
  const isMultiPlanConfig = isSharedConfig || isClientSharedConfig;

  const warnings = [];
  if (!hasExhibitTemplate) {
    warnings.push({ type: 'exhibit', message: 'No exhibit template associated — you must load or create an exhibit template before saving.', severity: 'error' });
  }
  if (!qdiaOptOut) {
    warnings.push({ type: 'qdia', message: 'QDIA option is missing (not opted out)' });
  }
  warnings.push({
    type: 'data',
    message: 'Data missing for:',
    items: ['PIMCO Total Return', 'Dodge & Cox Growth', 'Galliard Managed Income Fund'],
  });

  // Compute diff between saved record and live state
  const changes = useMemo(() => {
    if (!savedConfigRecord || !liveState) return [];
    const tracked = ['BulkRun', 'BulkTierOverrideID', 'BulkPctThresholdID', 'QDIACheckOptOut', 'CandidateInvestments', 'ExhibitTemplateID', 'IncludeFundChanges', 'OptInAllFundChanges', 'FundChangesInProgress', 'FundChangesExecuted'];
    const diffs = [];
    for (const field of tracked) {
      const oldVal = savedConfigRecord[field] ?? null;
      const newVal = liveState[field] ?? null;
      // For object values (fund change check maps), compare by JSON serialization
      if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          const desc = describeChange(field, oldVal, newVal, { templateLookup: allTemplates });
          diffs.push(desc);
        }
        continue;
      }
      // Normalize: treat undefined/null/false consistently
      const oldNorm = oldVal === false ? false : (oldVal || null);
      const newNorm = newVal === false ? false : (newVal || null);
      if (oldNorm !== newNorm) {
        const desc = describeChange(field, oldVal, newVal, { templateLookup: allTemplates });
        diffs.push(desc);
      }
    }
    return diffs;
  }, [savedConfigRecord, liveState, allTemplates]);

  const saveName = isSaveAs ? configName.trim() : (activeConfigName || configName.trim());

  const handleSave = () => {
    if (!saveName) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaveModalOpen(false);
      setConfirmModalOpen(false);
      if (onSaveConfig) {
        onSaveConfig({
          name: saveName,
          type: shareAsTemplate ? 'CAPTRUST Shared' : `Client ${configType === 'single' ? 'Single' : configType === 'multi' ? 'Multi' : 'Combo'} Plan`,
          primary: setAsPrimary,
          shared: shareAsTemplate,
          isUpdate: hasActiveConfig && !isSaveAs,
          isAdHoc: runAfterSave,
          adHocPeriod: runAfterSave ? periodLabel(selectedQuarter) : null,
        });
      }
      const sharedNote = shareAsTemplate ? ' and shared as a CAPTRUST template' : '';
      const action = hasActiveConfig && !isSaveAs ? 'updated' : 'saved';
      if (runAfterSave) {
        setRunAfterSave(false);
        const totalInvestments = reportPlans.reduce((sum, p) => sum + (p.investments?.length || 0), 0);
        const totalFcInProgress = reportPlans.reduce((sum, p) => sum + (p.fundChanges?.inProgress?.length || 0), 0);
        const totalFcExecuted = reportPlans.reduce((sum, p) => sum + (p.fundChanges?.executed?.length || 0), 0);
        const totalCandidates = reportPlans.reduce((sum, p) => sum + (p.candidates?.length || 0), 0);
        Modal.success({
          title: 'Ad-Hoc Report Queued',
          width: 720,
          content: (
            <div>
              <p style={{ marginBottom: 12 }}>
                <strong>"{saveName}"</strong> has been saved and your report for <strong>{periodLabel(selectedQuarter)}</strong> has been queued for processing.
              </p>

              {/* Summary bar */}
              <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <span><TeamOutlined style={{ color: '#52c41a', marginRight: 6 }} /><strong>{reportPlans.length}</strong> plan{reportPlans.length !== 1 ? 's' : ''}</span>
                <span><FileTextOutlined style={{ color: '#00437B', marginRight: 6 }} /><strong>{totalInvestments}</strong> investment{totalInvestments !== 1 ? 's' : ''}</span>
                {(totalFcInProgress > 0 || totalFcExecuted > 0) && (
                  <span><SwapOutlined style={{ color: '#fa8c16', marginRight: 6 }} /><strong>{totalFcInProgress + totalFcExecuted}</strong> fund change{totalFcInProgress + totalFcExecuted !== 1 ? 's' : ''}</span>
                )}
                {totalCandidates > 0 && (
                  <span><ExperimentOutlined style={{ color: '#d48806', marginRight: 6 }} /><strong>{totalCandidates}</strong> candidate{totalCandidates !== 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Per-plan breakdown */}
              {reportPlans.map((plan, idx) => (
                <div key={plan.ct_PlanID || idx} style={{ marginBottom: 16, border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ background: '#edf6fb', padding: '8px 12px', borderBottom: '1px solid #5FB4E5', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{plan.name || `Plan ${plan.ct_PlanID}`}</strong>
                    {plan.type && <Tag style={{ fontSize: 10 }}>{plan.type}</Tag>}
                    {plan._sourceConfigs && plan._sourceConfigs.length > 0 && (
                      <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 'auto' }}>
                        via: {plan._sourceConfigs.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Investments */}
                  {plan.investments && plan.investments.length > 0 ? (
                    <div style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#00437B', marginBottom: 4 }}>
                        Investments ({plan.investments.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {plan.investments.slice(0, 30).map((inv, i) => (
                          <Tag key={inv.ct_investmentid || i} style={{ fontSize: 11, margin: 0 }}>{inv.Ref}</Tag>
                        ))}
                        {plan.investments.length > 30 && (
                          <Tag style={{ fontSize: 11, margin: 0, color: '#8c8c8c' }}>+{plan.investments.length - 30} more</Tag>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 12px', fontSize: 12, color: '#8c8c8c' }}>
                      No investments assigned to this plan
                    </div>
                  )}

                  {/* Fund Changes */}
                  {plan.fundChanges && (plan.fundChanges.inProgress?.length > 0 || plan.fundChanges.executed?.length > 0) && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                      {plan.fundChanges.inProgress?.length > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#fa8c16', marginBottom: 4 }}>
                            Fund Changes — In Progress ({plan.fundChanges.inProgress.length})
                          </div>
                          {plan.fundChanges.inProgress.map((fc, i) => (
                            <div key={fc.id || i} style={{ fontSize: 11, padding: '2px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ color: '#ff4d4f' }}>{fc.currentInvestment || fc.currentFund}</span>
                              <span style={{ color: '#8c8c8c' }}>→</span>
                              <span style={{ color: '#52c41a' }}>{fc.replacementInvestment || fc.replacementFund}</span>
                              <span style={{ color: '#8c8c8c', fontSize: 10 }}>({fc.percentage}%)</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {plan.fundChanges.executed?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#52c41a', marginBottom: 4 }}>
                            Fund Changes — Past Year ({plan.fundChanges.executed.length})
                          </div>
                          {plan.fundChanges.executed.map((fc, i) => (
                            <div key={fc.id || i} style={{ fontSize: 11, padding: '2px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ color: '#ff4d4f' }}>{fc.currentInvestment || fc.currentFund}</span>
                              <span style={{ color: '#8c8c8c' }}>→</span>
                              <span style={{ color: '#52c41a' }}>{fc.replacementInvestment || fc.replacementFund}</span>
                              <span style={{ color: '#8c8c8c', fontSize: 10 }}>({fc.percentage}%)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Candidates */}
                  {plan.candidates && plan.candidates.length > 0 && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#d48806', marginBottom: 4 }}>
                        <ExperimentOutlined style={{ marginRight: 4 }} />
                        Candidate Investments ({plan.candidates.length})
                      </div>
                      {plan.candidates.map((cand, i) => (
                        <div key={cand.ct_investmentid || i} style={{ fontSize: 11, padding: '2px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>{cand.Ref}</Tag>
                          {cand.replacesRef && (
                            <span style={{ color: '#8c8c8c' }}>vs <strong>{cand.replacesRef}</strong></span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {reportPlans.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: '#8c8c8c', fontSize: 13 }}>
                  No plans configured for this report.
                </div>
              )}

              {/* Exhibit Pages with header text */}
              {exhibitPages.length > 0 && (
                <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ background: '#fafafa', padding: '8px 12px', borderBottom: '1px solid #d9d9d9', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UnorderedListOutlined style={{ color: '#3465CD' }} />
                    <strong style={{ fontSize: 13 }}>Exhibits ({exhibitPages.length})</strong>
                  </div>
                  <div style={{ padding: '8px 12px' }}>
                    {exhibitPages.map((page, i) => {
                      const headers = exhibitHeaders[page.id] || ['Default'];
                      const selectedIdx = selectedHeaderMap[page.id] || 0;
                      const headerText = headers[selectedIdx] || headers[0] || 'Default';
                      const isCustom = headerText !== 'Default';
                      return (
                        <div key={page.id || i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12 }}>
                          <Tag color={page.isTab ? 'blue' : undefined} style={{ fontSize: 11, margin: 0, minWidth: 0 }}>
                            {page.isTab ? 'TAB ' : ''}{page.name.replace(/^TAB - /, '')}
                          </Tag>
                          <span style={{ color: isCustom ? '#3465CD' : '#8c8c8c', fontSize: 11 }}>
                            — {headerText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Child config exhibits (combo only) */}
              {childConfigExhibits.length > 0 && childConfigExhibits.map((child, idx) => (
                <div key={idx} style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden', marginTop: 8 }}>
                  <div style={{ background: '#fafafa', padding: '6px 12px', borderBottom: '1px solid #d9d9d9', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <UnorderedListOutlined style={{ color: '#3465CD' }} />
                    <strong>{child.configName}</strong>
                    {child.templateName && (
                      <span style={{ color: '#8c8c8c' }}>
                        — {child.templateName}
                        {child.isShared && <Tag color="purple" style={{ fontSize: 10, marginLeft: 4 }}>Shared</Tag>}
                      </span>
                    )}
                    <Tag style={{ marginLeft: 'auto', fontSize: 10 }}>{child.pages.length} pages</Tag>
                  </div>
                  <div style={{ padding: '6px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {child.pages.map((page, i) => (
                      <Tag key={page.id || i} color={page.isTab ? 'blue' : undefined} style={{ fontSize: 11, margin: 0 }}>
                        {page.isTab ? 'TAB ' : ''}{page.name.replace(/^TAB - /, '')}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ),
        });
      } else {
        Modal.success({
          title: hasActiveConfig && !isSaveAs ? 'Configuration Updated' : 'Configuration Saved',
          content: `"${saveName}" has been ${action}${setAsPrimary ? ' as the Primary config' : ''}${sharedNote} successfully.`,
        });
      }
      setConfigName('');
      setSetAsPrimary(false);
      setShareAsTemplate(false);
      setIsSaveAs(false);
    }, 800);
  };

  // Quick save — show confirmation modal with diff
  const handleQuickSave = () => {
    if (!activeConfigName || !activeConfigId) return;
    if (!hasExhibitTemplate) {
      Modal.warning({
        title: 'Exhibit Template Required',
        content: 'You must associate or create an exhibit template before saving a report configuration. Open the Exhibit Menu section to load an existing template or save a new one.',
      });
      return;
    }
    setConfirmModalOpen(true);
  };

  // Save association only — maps this plan to the shared config without modifying config settings
  const confirmSaveAssociationOnly = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setConfirmModalOpen(false);
      if (onSaveConfig) {
        onSaveConfig({
          name: activeConfigName,
          type: `Client ${configType === 'single' ? 'Single' : configType === 'multi' ? 'Multi' : 'Combo'} Plan`,
          primary: false,
          shared: false,
          isUpdate: false,
          associationOnly: true,
        });
      }
      message.success(`Plan associated with "${activeConfigName}"`);
    }, 500);
  };

  // Full save — update the config with current settings
  const confirmQuickSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setConfirmModalOpen(false);
      if (onSaveConfig) {
        onSaveConfig({
          name: activeConfigName,
          type: `Client ${configType === 'single' ? 'Single' : configType === 'multi' ? 'Multi' : 'Combo'} Plan`,
          primary: false,
          shared: false,
          isUpdate: true,
        });
      }
      message.success(`"${activeConfigName}" saved`);
    }, 500);
  };

  const showExhibitTemplateWarning = () => {
    Modal.warning({
      title: 'Exhibit Template Required',
      content: 'You must associate or create an exhibit template before saving a report configuration. Open the Exhibit Menu section to load an existing template or save a new one.',
    });
  };

  // Period label helper for naming
  const periodLabel = (q) => q === '2025-Q4' ? 'Q4 2025' : 'Q3 2025';

  const handleRunNow = () => {
    setRunNowModalOpen(false);
    if (!hasExhibitTemplate) {
      showExhibitTemplateWarning();
      return;
    }
    setRunAfterSave(true);
    // Always create a new ad-hoc config — never overwrite the primary
    setIsSaveAs(true);
    const baseName = activeConfigName || 'Report Config';
    setConfigName(`${baseName} - ${periodLabel(selectedQuarter)}`);
    setSetAsPrimary(false);
    setShareAsTemplate(false);
    setSaveModalOpen(true);
  };

  const openSaveAsModal = () => {
    if (!hasExhibitTemplate) {
      showExhibitTemplateWarning();
      return;
    }
    setRunAfterSave(false);
    setSetAsPrimary(false);
    setConfigName('');
    setIsSaveAs(true);
    setSaveModalOpen(true);
  };

  const openSaveModal = () => {
    if (!hasExhibitTemplate) {
      showExhibitTemplateWarning();
      return;
    }
    setRunAfterSave(false);
    setSetAsPrimary(false);
    setConfigName('');
    setIsSaveAs(false);
    setSaveModalOpen(true);
  };

  const modalTitle = runAfterSave
    ? 'Run Ad-Hoc Report'
    : isSaveAs
      ? 'Save As New Report Configuration'
      : hasActiveConfig
        ? `Update "${activeConfigName}"`
        : 'Save Report Configuration';

  return (
    <>
      {/* --- Data Checks Group --- */}
      <div style={{ borderLeft: '3px solid #7CA7AE', paddingLeft: 16, marginBottom: 16, marginTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7CA7AE', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Data Checks
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
          Compliance validations and data availability status
        </div>
        {warnings.map((w, idx) => (
          <Alert
            key={idx}
            type={w.severity === 'error' ? 'error' : 'warning'}
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 8 }}
            message={
              <div>
                <span>{w.message}</span>
                {w.items && (
                  <ul style={{ margin: '4px 0 0 20px', fontSize: 13 }}>
                    {w.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
              </div>
            }
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="config-section">
        <div className="section-body">
          <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size="middle">
              {hasActiveConfig ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    onClick={handleQuickSave}
                  >
                    Save
                  </Button>
                  <Button
                    size="large"
                    icon={<CopyOutlined />}
                    onClick={openSaveAsModal}
                  >
                    Save As New Report Config
                  </Button>
                </>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={openSaveModal}
                >
                  Save Report Configuration
                </Button>
              )}
            </Space>

            <Button
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => setRunNowModalOpen(true)}
            >
              Run Now
            </Button>
          </Space>
        </div>
      </div>

      {/* Confirm Save Modal — shows diff of changes */}
      <Modal
        title={isSharedConfig
          ? `Associate "${activeConfigName}"`
          : isClientSharedConfig
            ? `Save "${activeConfigName}"?`
            : `Save "${activeConfigName}"?`}
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        width={540}
        footer={isSharedConfig ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Button onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Space>
              <Button
                type="primary"
                loading={saving}
                onClick={confirmSaveAssociationOnly}
                icon={<CheckCircleOutlined />}
              >
                Save Association
              </Button>
              {isTemplateAdmin && changes.length > 0 && (
                <Button
                  type="primary"
                  danger
                  loading={saving}
                  onClick={confirmQuickSave}
                  icon={<SaveOutlined />}
                >
                  Save Association & Update Config
                </Button>
              )}
            </Space>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={confirmQuickSave}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      >
        {savedConfigRecord?.Primary && (
          <Alert
            type="warning"
            showIcon
            icon={<StarFilled style={{ color: '#faad14' }} />}
            style={{ marginBottom: 16 }}
            message={
              <span>
                <strong>You are modifying the Primary report configuration.</strong>
                <br />
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  This is the default config used for scheduled bulk runs. Changes will affect all future bulk-generated reports for this plan.
                </span>
              </span>
            }
          />
        )}

        {isSharedConfig && (
          <Alert
            type="info"
            showIcon
            icon={<ShareAltOutlined style={{ color: '#00437B' }} />}
            style={{ marginBottom: 16, border: '1px solid #5FB4E5' }}
            message={
              <span>
                <strong>"{activeConfigName}"</strong> is a shared CAPTRUST report configuration.
                <br />
                {sharedConfigPlanCount > 0 ? (
                  <span style={{ fontSize: 12, color: '#595959' }}>
                    Currently used as the default for <strong>{sharedConfigPlanCount}</strong> plan{sharedConfigPlanCount !== 1 ? 's' : ''} across all clients.
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    This is a shared template available to all CAPTRUST advisors.
                  </span>
                )}
              </span>
            }
          />
        )}

        {isClientSharedConfig && (
          <Alert
            type="warning"
            showIcon
            icon={<TeamOutlined style={{ color: '#fa8c16' }} />}
            style={{ marginBottom: 16, border: '1px solid #ffd591' }}
            message={
              <span>
                <strong>This configuration is also used by {otherPlansUsingConfig.length} other plan{otherPlansUsingConfig.length !== 1 ? 's' : ''} in this client.</strong>
                <br />
                <span style={{ fontSize: 12, color: '#595959' }}>
                  {otherPlansUsingConfig.length <= 5
                    ? <>Plans: {otherPlansUsingConfig.map(p => p.name).join(', ')}. </>
                    : null
                  }
                  Saving changes will update the configuration for all plans using it.
                </span>
              </span>
            }
          />
        )}

        {/* For CAPTRUST shared configs, explain the two save options */}
        {isSharedConfig && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 8,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                Save Association
              </div>
              <div style={{ fontSize: 12, color: '#595959', marginLeft: 20 }}>
                Links this plan to the shared configuration. The shared template itself will not be modified.
              </div>
            </div>
            {isTemplateAdmin && changes.length > 0 && (
              <div style={{
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: 6,
                padding: '10px 14px',
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                  <SaveOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />
                  Save Association & Update Config
                </div>
                <div style={{ fontSize: 12, color: '#595959', marginLeft: 20 }}>
                  Links this plan AND saves your changes to the shared template. This will affect all plans using this configuration.
                </div>
              </div>
            )}
            {!isTemplateAdmin && changes.length > 0 && (
              <div style={{
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: 6,
                padding: '10px 14px',
              }}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  <LockOutlined style={{ marginRight: 6 }} />
                  You have made changes to this configuration, but only template administrators can update shared configs.
                  Use <strong>"Save As New Report Config"</strong> to save a client-specific copy with your changes.
                </div>
              </div>
            )}
          </div>
        )}

        {planGroupChanged && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <span>
                <strong>The plan group has been modified.</strong>
                {planGroupName && <> (Group: <strong>{planGroupName}</strong>)</>}
                <br />
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  The plans included in this report configuration have changed since it was last saved or loaded.
                  Saving will update which plans are covered by this multi plan report.
                </span>
              </span>
            }
          />
        )}

        {changes.length > 0 ? (
          <>
            <p style={{ color: '#595959', marginBottom: 12, fontSize: 13 }}>
              {isSharedConfig
                ? 'The following changes have been made to the configuration:'
                : 'The following changes will be saved:'}
            </p>
            <div style={{
              background: '#fafafa',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              padding: '4px 0',
            }}>
              {changes.map((ch, i) => (
                <div key={i} style={{
                  padding: '8px 16px',
                  borderBottom: i < changes.length - 1 ? '1px solid #f0f0f0' : 'none',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <SwapOutlined style={{ color: '#00437B', fontSize: 12, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, minWidth: 160 }}>{ch.label}</span>
                  <span style={{ color: '#ff4d4f', textDecoration: 'line-through', fontSize: 12 }}>{ch.from}</span>
                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>&rarr;</span>
                  <span style={{ color: '#52c41a', fontWeight: 600, fontSize: 12 }}>{ch.to}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#8c8c8c' }}>
            <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
            <div>{isSharedConfig ? 'No changes to the shared configuration. Save the association to link this plan.' : 'No changes detected. Save anyway to update the timestamp?'}</div>
          </div>
        )}
      </Modal>

      {/* Save / Save As Modal */}
      <Modal
        title={modalTitle}
        open={saveModalOpen}
        onCancel={() => { setSaveModalOpen(false); setRunAfterSave(false); setSetAsPrimary(false); setShareAsTemplate(false); setIsSaveAs(false); }}
        onOk={handleSave}
        okText={saving ? 'Saving...' : runAfterSave ? 'Save & Run' : isSaveAs ? 'Save As New' : hasActiveConfig ? 'Update' : 'Save'}
        confirmLoading={saving}
        okButtonProps={{ disabled: isSaveAs ? !configName.trim() : !saveName }}
      >
        {runAfterSave && (
          <Alert
            type="info"
            showIcon
            icon={<PlayCircleOutlined />}
            style={{ marginBottom: 16 }}
            message={
              <span>
                A new ad-hoc report configuration will be created for <strong>{periodLabel(selectedQuarter)}</strong>.
                Your primary config will not be modified.
              </span>
            }
          />
        )}

        <p style={{ color: '#8c8c8c', marginBottom: 16, fontSize: 13 }}>
          {runAfterSave
            ? 'Name this ad-hoc run. The report will be queued for processing after saving.'
            : isSaveAs
              ? 'Create a new report configuration based on your current settings.'
              : hasActiveConfig
                ? `Update "${activeConfigName}" with your current settings.`
                : 'Save this configuration for future use. It will be available for bulk runs and can be loaded by any team member with access to this client.'
          }
        </p>

        {warnings.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="There are validation warnings. You may still save, but please review before running."
          />
        )}

        {/* Config name — only show for Save As or new save */}
        {(isSaveAs || !hasActiveConfig) && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4, color: '#8c8c8c' }}>
              Configuration Name
            </label>
            <Input
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="e.g., Demo Client DC Plan 1 - Q4 2025 Final"
              size="large"
              autoFocus
            />
          </div>
        )}

        {/* Set as Primary — hidden for ad-hoc runs */}
        {!runAfterSave && (
        <div style={{
          background: setAsPrimary ? '#f6ffed' : '#fafafa',
          border: `1px solid ${setAsPrimary ? '#b7eb8f' : '#d9d9d9'}`,
          borderRadius: 6,
          padding: 12,
          transition: 'all 0.2s',
        }}>
          <Checkbox
            checked={setAsPrimary}
            onChange={(e) => setSetAsPrimary(e.target.checked)}
          >
            <Space>
              <StarFilled style={{ color: setAsPrimary ? '#faad14' : '#d9d9d9' }} />
              <strong>Set as Primary Report Configuration</strong>
            </Space>
          </Checkbox>

          {setAsPrimary && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginTop: 12 }}
              message={
                <span>
                  <strong>This will set this configuration as the Primary.</strong>
                  {' '}The Primary config is the default used for all scheduled bulk runs.
                  {currentPrimaryName && currentPrimaryName !== activeConfigName && (
                    <>
                      <br />
                      <span style={{ marginTop: 4, display: 'inline-block' }}>
                        Replaces current Primary:{' '}
                        <Tag color="gold" style={{ fontSize: 11 }}>
                          <StarFilled style={{ marginRight: 4 }} />
                          {currentPrimaryName}
                        </Tag>
                      </span>
                      <br />
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                        The previous Primary will remain saved but will no longer be marked as Primary.
                      </span>
                    </>
                  )}
                </span>
              }
            />
          )}

          {!setAsPrimary && (
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, marginLeft: 24 }}>
              The Primary config is used for scheduled bulk runs. Each plan should have exactly one.
            </div>
          )}
        </div>
        )}

        {/* Share as Template — hidden for ad-hoc runs */}
        {!runAfterSave && (canShareTemplates ? (
          <div style={{
            background: shareAsTemplate ? '#edf6fb' : '#fafafa',
            border: `1px solid ${shareAsTemplate ? '#5FB4E5' : '#d9d9d9'}`,
            borderRadius: 6,
            padding: 12,
            marginTop: 12,
            transition: 'all 0.2s',
          }}>
            <Checkbox
              checked={shareAsTemplate}
              onChange={(e) => setShareAsTemplate(e.target.checked)}
            >
              <Space>
                <ShareAltOutlined style={{ color: shareAsTemplate ? '#5B325F' : '#d9d9d9' }} />
                <strong>Share as CAPTRUST Template</strong>
              </Space>
            </Checkbox>

            {shareAsTemplate && (
              <Alert
                type="info"
                showIcon
                style={{ marginTop: 12 }}
                message={
                  <span>
                    This configuration will be available to all CAPTRUST advisors as a shared template.
                    It will appear in the <strong>Shared Templates</strong> section when loading configs.
                    <br />
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      The original client config will also be saved. You can unshare it later.
                    </span>
                  </span>
                }
              />
            )}

            {!shareAsTemplate && (
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, marginLeft: 24 }}>
                Make this config available as a starting point for other advisors and clients.
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 12,
            marginTop: 12,
            opacity: 0.6,
          }}>
            <Space>
              <LockOutlined style={{ color: '#d9d9d9' }} />
              <span style={{ color: '#8c8c8c', fontSize: 13 }}>
                <strong>Share as CAPTRUST Template</strong> — requires template administrator permissions
              </span>
            </Space>
          </div>
        ))}
      </Modal>

      {/* Run Now Modal */}
      <Modal
        title="Run Report Now"
        open={runNowModalOpen}
        onCancel={() => setRunNowModalOpen(false)}
        onOk={handleRunNow}
        okText="Continue to Save"
      >
        <p style={{ color: '#8c8c8c', marginBottom: 16, fontSize: 13 }}>
          Run an ad-hoc report outside of the bulk scheduling process.
          You must save the report configuration before the report can be queued.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4, color: '#8c8c8c' }}>
            Time Period
          </label>
          <Select
            value={selectedQuarter}
            onChange={setSelectedQuarter}
            style={{ width: '100%' }}
            size="large"
            options={[
              { value: '2025-Q4', label: 'Q4 2025 (12-31-2025) \u2014 Current Quarter End' },
              { value: '2025-Q3', label: 'Q3 2025 (09-30-2025) \u2014 Previous Quarter End' },
            ]}
          />
        </div>

        <Alert
          type="info"
          showIcon
          message="A new ad-hoc report configuration will be created with the selected period appended to the name. Your primary config will not be modified."
          style={{ fontSize: 13 }}
        />
      </Modal>
    </>
  );
}
