import { useState, useMemo, useEffect, useRef } from 'react';
import { Tag, Button, Alert, Checkbox, Space, message } from 'antd';
import { MergeCellsOutlined, StarFilled, SwapOutlined, AppstoreOutlined, CheckCircleOutlined, WarningFilled, FilterOutlined } from '@ant-design/icons';
import { reportConfigTypes, pagesets } from '../data/mockData';
import { resolveExhibitPageSetIds } from '../data/dataResolvers';
import DualListBox from './DualListBox';
import ExhibitMenuSection from './ExhibitMenuSection';
import BulkRunSection from './BulkRunSection';
import SaveConfigSection from './SaveConfigSection';

const emptyManagerGroups = [
  { id: 'default', name: 'Default Group', managers: [], customTier: null },
];

export default function ComboConfig({
  period,
  loadedConfig,
  allConfigs = [],
  allPlans = [],
  allPlanGroups = [],
  allInvestments = [],
  allFundChanges = [],
  clientAccountId,
  onSaveConfig,
  activeConfigName,
  activeConfigId,
  currentPrimaryName,
  savedConfigRecord,
  allTemplates,
  onSaveTemplate,
  onUpdateTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  isTemplateAdmin = false,
  exhibitImages = {},
  exhibitHeaders = {},
}) {
  // Eligible child configs: single (1) or multi (2) plans, for this client only
  const comboEligibleConfigs = useMemo(() =>
    allConfigs
      .filter(c => c.ReportConfigType === 1 || c.ReportConfigType === 2)
      .filter(c => c.AccountID === clientAccountId)
      .map(c => {
        const typeName = reportConfigTypes[c.ReportConfigType];
        // For single plan configs, show the plan name so users can identify which plan
        let planLabel = '';
        if (c.ReportConfigType === 1 && c.ct_PlanID) {
          const plan = allPlans.find(p => p.ct_PlanID === c.ct_PlanID);
          planLabel = plan ? ` — ${plan.name}` : '';
        }
        // For multi plan configs, show the plan group name
        let groupLabel = null;
        if (c.ReportConfigType === 2) {
          // Check saved _planGroupName on the config first, then look up from plan groups
          if (c._planGroupName) {
            groupLabel = c._planGroupName;
          } else {
            const group = allPlanGroups.find(g => g.ReportConfigID === c.ReportConfigID);
            if (group) groupLabel = group.ReportPlanGroupName;
          }
        }
        return {
          ...c,
          id: c.ReportConfigID,
          name: `${c.ReportConfigName} (${typeName}${planLabel})`,
          _planName: planLabel ? planLabel.replace(' — ', '') : null,
          _groupName: groupLabel,
          _typeName: typeName,
        };
      }),
    [allConfigs, allPlans, allPlanGroups]
  );

  const [selectedConfigs, setSelectedConfigs] = useState([]);
  const [availableConfigs, setAvailableConfigs] = useState(comboEligibleConfigs);
  const [primaryOnlyFilter, setPrimaryOnlyFilter] = useState(false);
  const [aggregateFactSheets, setAggregateFactSheets] = useState(false);
  const [replaceSpotlights, setReplaceSpotlights] = useState(false);
  const [qdiaOptOut, setQdiaOptOut] = useState(false);

  // Exhibit menu state
  const [selectedExhibitIds, setSelectedExhibitIds] = useState([]);
  const [exhibitTemplateName, setExhibitTemplateName] = useState(null);
  const [exhibitTemplateId, setExhibitTemplateId] = useState(null);
  const [exhibitCategoryId, setExhibitCategoryId] = useState(1);
  // Combo-level suppression of duplicate Core Shared pagesets — { pagesetId: true }
  // When a user adds a Core Shared pageset at Combo level and toggles suppress,
  // the same pageset is hidden from all child configs at render time.
  const [comboSuppressMap, setComboSuppressMap] = useState({});

  // Bulk run state (lifted)
  const [includeInBulk, setIncludeInBulk] = useState(true);
  const [bulkUnlocked, setBulkUnlocked] = useState(false);
  const [bulkTierOverrideId, setBulkTierOverrideId] = useState(null);
  const [bulkPctThresholdId, setBulkPctThresholdId] = useState(null);

  const lastToastedConfigRef = useRef(null);

  // --- Restore state from loaded config ---
  useEffect(() => {
    if (!loadedConfig) return;
    // Guard: ignore loadedConfig that was built for a different config type
    if (loadedConfig.configType && loadedConfig.configType !== 'combo') return;

    // Restore child config selections
    if (loadedConfig._selectedConfigIDs && loadedConfig._selectedConfigIDs.length > 0) {
      const selectedIds = new Set(loadedConfig._selectedConfigIDs);
      const restored = comboEligibleConfigs.filter(c => selectedIds.has(c.ReportConfigID));
      const remaining = comboEligibleConfigs.filter(c => !selectedIds.has(c.ReportConfigID));
      setSelectedConfigs(restored);
      setAvailableConfigs(remaining);
    }

    // Restore combo options
    setAggregateFactSheets(loadedConfig._aggregateFactSheets ?? false);
    setReplaceSpotlights(loadedConfig._replaceSpotlights ?? false);

    // Restore exhibit template
    setSelectedExhibitIds(loadedConfig.selectedExhibitIds ?? []);
    setExhibitTemplateName(loadedConfig.exhibitTemplateName ?? null);
    setExhibitTemplateId(loadedConfig.exhibitTemplate?.ExhibitTemplateID ?? null);
    setExhibitCategoryId(loadedConfig.exhibitCategoryId ?? 1);
    setComboSuppressMap(loadedConfig._comboSuppressMap ?? {});

    // Restore QDIA
    setQdiaOptOut(loadedConfig.qdiaOptOut ?? loadedConfig.QDIACheckOptOut ?? false);

    // Restore bulk run
    setIncludeInBulk(loadedConfig.includeInBulk ?? true);
    setBulkUnlocked(loadedConfig.bulkUnlocked ?? false);
    setBulkTierOverrideId(loadedConfig.bulkTierOverrideId ?? null);
    setBulkPctThresholdId(loadedConfig.bulkPctThresholdId ?? null);

    const toastKey = loadedConfig.ReportConfigID || loadedConfig._key;
    if (!loadedConfig._autoLoad && lastToastedConfigRef.current !== toastKey) {
      lastToastedConfigRef.current = toastKey;
      const parts = ['Report configuration'];
      if (loadedConfig.exhibitTemplateName) parts.push(`exhibit template "${loadedConfig.exhibitTemplateName}"`);
      message.success(`${parts.join(' and ')} loaded`);
    }
  }, [loadedConfig]);

  // Build report plans for Run Now preview — resolve plans from all selected child configs
  const comboReportPlans = useMemo(() => {
    const planIdSet = new Set();
    selectedConfigs.forEach(config => {
      if (config.ReportConfigType === 1 && config.ct_PlanID) {
        // Single plan config — one plan
        planIdSet.add(config.ct_PlanID);
      } else if (config.ReportConfigType === 2) {
        // Multi plan config — get plan IDs from _planIds or plan group
        if (config._planIds && config._planIds.length > 0) {
          config._planIds.forEach(id => planIdSet.add(id));
        } else {
          // Fall back to plan group junction
          const group = allPlanGroups.find(g => g.ReportConfigID === config.ReportConfigID);
          if (group) group.ct_PlanIDs.forEach(id => planIdSet.add(id));
        }
      }
    });
    return [...planIdSet].map(planId => {
      const plan = allPlans.find(p => p.ct_PlanID === planId);
      const planChanges = allFundChanges.filter(fc => fc.ct_PlanID === planId);
      return {
        ...(plan || { ct_PlanID: planId, name: `Plan ${planId}` }),
        investments: allInvestments.filter(inv => inv.ct_PlanID === planId),
        fundChanges: {
          inProgress: planChanges.filter(fc => fc.changeType === 'inProgress'),
          executed: planChanges.filter(fc => fc.changeType === 'executed'),
        },
        // Track which child config(s) include this plan
        _sourceConfigs: selectedConfigs
          .filter(c => {
            if (c.ReportConfigType === 1) return c.ct_PlanID === planId;
            if (c._planIds) return c._planIds.includes(planId);
            const g = allPlanGroups.find(g2 => g2.ReportConfigID === c.ReportConfigID);
            return g ? g.ct_PlanIDs.includes(planId) : false;
          })
          .map(c => c.ReportConfigName),
      };
    });
  }, [selectedConfigs, allPlans, allInvestments, allPlanGroups]);

  // Resolve exhibit pages from each child config's exhibit template
  const childConfigExhibits = useMemo(() => {
    return selectedConfigs.map(config => {
      const template = config.ExhibitTemplateID
        ? allTemplates.find(t => t.ExhibitTemplateID === config.ExhibitTemplateID)
        : null;
      const pageIds = template?._sessionIds?.length > 0
        ? template._sessionIds
        : (config.ExhibitTemplateID ? resolveExhibitPageSetIds(config.ExhibitTemplateID) : []);
      const pages = pageIds.map(id => pagesets.find(p => p.id === id)).filter(Boolean);
      return {
        configName: config.ReportConfigName,
        templateName: template?.Name || null,
        isShared: template && (template.AccountID === null || template.AccountID === undefined),
        pages,
      };
    }).filter(c => c.pages.length > 0);
  }, [selectedConfigs, allTemplates]);

  // Filtered available configs (primary only toggle)
  const filteredAvailable = useMemo(() => {
    if (!primaryOnlyFilter) return availableConfigs;
    return availableConfigs.filter(c => c.Primary);
  }, [availableConfigs, primaryOnlyFilter]);

  // Detect duplicate plans across selected configs
  const duplicatePlans = useMemo(() => {
    const planConfigMap = {}; // planId → [{ configName, planName }]
    selectedConfigs.forEach(config => {
      const resolvePlanIds = (c) => {
        if (c.ReportConfigType === 1 && c.ct_PlanID) return [c.ct_PlanID];
        if (c.ReportConfigType === 2) {
          if (c._planIds && c._planIds.length > 0) return c._planIds;
          const group = allPlanGroups.find(g => g.ReportConfigID === c.ReportConfigID);
          return group ? group.ct_PlanIDs : [];
        }
        return [];
      };
      resolvePlanIds(config).forEach(planId => {
        if (!planConfigMap[planId]) planConfigMap[planId] = [];
        planConfigMap[planId].push(config.ReportConfigName);
      });
    });
    return Object.entries(planConfigMap)
      .filter(([, configs]) => configs.length > 1)
      .map(([planId, configNames]) => {
        const plan = allPlans.find(p => p.ct_PlanID === Number(planId));
        return {
          planId,
          planName: plan ? plan.name : `Plan ${planId}`,
          configNames,
        };
      });
  }, [selectedConfigs, allPlans, allPlanGroups]);

  const handleDualListChange = (newSelected, newAvailable) => {
    setSelectedConfigs(newSelected);
    setAvailableConfigs(newAvailable);
  };

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Combo reports combine multiple Single Plan and Consolidated report configurations into a unified report."
      />

      {/* Config Selection */}
      <div className="config-section">
        <div className="section-header">
          <h3>
            <MergeCellsOutlined />
            Report Configuration (COMBO)
          </h3>
        </div>
        <div className="section-body">
          <div style={{ marginBottom: 8 }}>
            <Checkbox
              checked={primaryOnlyFilter}
              onChange={(e) => setPrimaryOnlyFilter(e.target.checked)}
            >
              <span style={{ fontSize: 12 }}>
                <FilterOutlined style={{ marginRight: 4 }} />
                Show Primary configs only
              </span>
            </Checkbox>
          </div>
          <DualListBox
            selectedItems={selectedConfigs}
            availableItems={filteredAvailable}
            onSelectedChange={(newSelected, newAvailable) => {
              setSelectedConfigs(newSelected);
              // Merge filtered-out items back into available
              const filteredIds = new Set(filteredAvailable.map(c => c.id));
              const hidden = availableConfigs.filter(c => !filteredIds.has(c.id));
              setAvailableConfigs([...hidden, ...newAvailable]);
            }}
            selectedTitle="Current Configs"
            availableTitle={`Available Report Configs${primaryOnlyFilter ? ' (Primary)' : ''}`}
            renderItem={(config) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{config.ReportConfigName}</span>
                {config.Primary && (
                  <Tag color="gold" style={{ fontSize: 10, marginRight: 0 }}>
                    <StarFilled style={{ marginRight: 3 }} />Primary
                  </Tag>
                )}
                <Tag color="blue" style={{ fontSize: 10, marginRight: 0 }}>{config._typeName}</Tag>
                {config._planName && (
                  <Tag color="cyan" style={{ fontSize: 10, marginRight: 0 }}>{config._planName}</Tag>
                )}
                {config._groupName && (
                  <Tag color="green" style={{ fontSize: 10, marginRight: 0 }}>{config._groupName}</Tag>
                )}
              </span>
            )}
          />

          {/* Duplicate plan detection */}
          {duplicatePlans.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Alert
                type="error"
                showIcon
                icon={<WarningFilled />}
                style={{ fontSize: 13, border: '2px solid #ff4d4f' }}
                message={
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    Plan Duplication Detected
                  </span>
                }
                description={
                  <div style={{ marginTop: 4 }}>
                    <div style={{ marginBottom: 8 }}>
                      The following plan(s) appear in multiple selected configurations. This will produce duplicate report sections.
                    </div>
                    {duplicatePlans.map(dp => (
                      <div key={dp.planId} style={{ padding: '4px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <Tag color="red" style={{ fontWeight: 600, marginRight: 0 }}>{dp.planName}</Tag>
                        <span style={{ fontSize: 12, color: '#595959' }}>
                          found in: {dp.configNames.map((name, i) => (
                            <span key={i}>
                              {i > 0 && ', '}
                              <strong>{name}</strong>
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                      Remove one of the overlapping configurations or adjust the plan group to resolve.
                    </div>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Sections managed by child configs — uniform disabled treatment */}
      {['Plan Fund Changes'].map((label) => (
        <div className="config-section" key={label}>
          <div className="section-header">
            <h3>
              {label === 'Plan Fund Changes' && <SwapOutlined />}
              {label === 'Asset Class / Manager Groups' && <AppstoreOutlined />}
              {label === 'QDIA Check' && <CheckCircleOutlined />}
              {label}
            </h3>
          </div>
          <div className="section-body" style={{ padding: '12px 20px' }}>
            <Alert
              type="info"
              showIcon
              message={`${label} settings are managed within the individual report configurations selected above.`}
              style={{ fontSize: 13 }}
            />
          </div>
        </div>
      ))}

      {/* Child config exhibit pages */}
      {childConfigExhibits.length > 0 && (
        <div className="config-section">
          <div className="section-header">
            <h3>
              <AppstoreOutlined />
              Child Config Exhibits
              <Tag style={{ marginLeft: 8, fontSize: 11 }}>{childConfigExhibits.reduce((sum, c) => sum + c.pages.length, 0)} pages</Tag>
            </h3>
          </div>
          <div className="section-body">
            {childConfigExhibits.map((child, idx) => (
              <div key={idx} style={{ marginBottom: idx < childConfigExhibits.length - 1 ? 12 : 0, border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ background: '#fafafa', padding: '6px 12px', borderBottom: '1px solid #d9d9d9', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <strong>{child.configName}</strong>
                  {child.templateName && (
                    <span style={{ color: '#8c8c8c' }}>
                      — {child.templateName}
                      {child.isShared && <Tag color="purple" style={{ fontSize: 10, marginLeft: 4 }}>Shared</Tag>}
                    </span>
                  )}
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
        </div>
      )}

      <ExhibitMenuSection
        configType="combo"
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
        comboSuppressMap={comboSuppressMap}
        setComboSuppressMap={setComboSuppressMap}
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
        configType="combo"
        qdiaOptOut={qdiaOptOut}
        setQdiaOptOut={setQdiaOptOut}
        reportPlans={comboReportPlans}
        onSaveConfig={(args) => onSaveConfig && onSaveConfig({
          ...args,
          ExhibitTemplateID: exhibitTemplateId,
          BulkRun: includeInBulk,
          BulkTierOverrideID: bulkUnlocked ? bulkTierOverrideId : null,
          BulkPctThresholdID: bulkUnlocked ? bulkPctThresholdId : null,
          QDIACheckOptOut: qdiaOptOut,
          AggregateFactSheets: aggregateFactSheets,
          ReplaceSpotlights: replaceSpotlights,
          SelectedConfigIDs: selectedConfigs.map(c => c.ReportConfigID),
          _comboSuppressMap: comboSuppressMap,
        })}
        currentPrimaryName={currentPrimaryName}
        activeConfigName={activeConfigName}
        activeConfigId={activeConfigId}
        savedConfigRecord={savedConfigRecord}
        allTemplates={allTemplates}
        isTemplateAdmin={isTemplateAdmin}
        allPlans={allPlans}
        childConfigExhibits={childConfigExhibits}
        exhibitHeaders={exhibitHeaders}
        liveState={{
          ExhibitTemplateID: exhibitTemplateId,
          BulkRun: includeInBulk,
          BulkTierOverrideID: bulkUnlocked ? bulkTierOverrideId : null,
          BulkPctThresholdID: bulkUnlocked ? bulkPctThresholdId : null,
          QDIACheckOptOut: qdiaOptOut,
          AggregateFactSheets: aggregateFactSheets,
          ReplaceSpotlights: replaceSpotlights,
          SelectedConfigIDs: selectedConfigs.map(c => c.ReportConfigID),
        }}
      />
    </div>
  );
}
