import { useState, useMemo } from 'react';
import { Tag, Button, Alert, Checkbox, Space } from 'antd';
import { MergeCellsOutlined, StarFilled, SwapOutlined, AppstoreOutlined, CheckCircleOutlined, WarningFilled } from '@ant-design/icons';
import { reportConfigTypes } from '../data/mockData';
import DualListBox from './DualListBox';
import ExhibitMenuSection from './ExhibitMenuSection';
import BulkRunSection from './BulkRunSection';
import SaveConfigSection from './SaveConfigSection';

const emptyManagerGroups = [
  { id: 'default', name: 'Default Group', managers: [], customTier: null },
];

export default function ComboConfig({
  period,
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
  const [aggregateFactSheets, setAggregateFactSheets] = useState(false);
  const [replaceSpotlights, setReplaceSpotlights] = useState(false);

  // Exhibit menu state
  const [selectedExhibitIds, setSelectedExhibitIds] = useState([]);
  const [exhibitTemplateName, setExhibitTemplateName] = useState(null);
  const [exhibitTemplateId, setExhibitTemplateId] = useState(null);
  const [exhibitCategoryId, setExhibitCategoryId] = useState(1);

  // Bulk run state (lifted)
  const [includeInBulk, setIncludeInBulk] = useState(true);
  const [bulkUnlocked, setBulkUnlocked] = useState(false);
  const [bulkTierOverrideId, setBulkTierOverrideId] = useState(null);
  const [bulkPctThresholdId, setBulkPctThresholdId] = useState(null);

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
        message="Combo reports combine multiple Single Plan and Multi Plan configurations into a unified report."
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
          <DualListBox
            selectedItems={selectedConfigs}
            availableItems={availableConfigs}
            onSelectedChange={handleDualListChange}
            selectedTitle="Current Configs"
            availableTitle="Available Report Configs"
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

      {/* Combo Options */}
      <div className="config-section">
        <div className="section-body" style={{ padding: '12px 20px' }}>
          <Space direction="vertical">
            <Checkbox
              checked={aggregateFactSheets}
              onChange={(e) => setAggregateFactSheets(e.target.checked)}
            >
              Aggregate Fact Sheets across children plans
            </Checkbox>
            <Checkbox
              checked={replaceSpotlights}
              onChange={(e) => setReplaceSpotlights(e.target.checked)}
            >
              Replace topical spotlights with Combo level
            </Checkbox>
          </Space>
        </div>
      </div>

      {/* Sections managed by child configs — uniform disabled treatment */}
      {['Plan Fund Changes', 'Asset Class / Manager Groups', 'QDIA Check'].map((label) => (
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
        reportPlans={comboReportPlans}
        onSaveConfig={(args) => onSaveConfig && onSaveConfig({
          ...args,
          ExhibitTemplateID: exhibitTemplateId,
          BulkRun: includeInBulk,
          BulkTierOverrideID: bulkUnlocked ? bulkTierOverrideId : null,
          BulkPctThresholdID: bulkUnlocked ? bulkPctThresholdId : null,
          AggregateFactSheets: aggregateFactSheets,
          ReplaceSpotlights: replaceSpotlights,
          SelectedConfigIDs: selectedConfigs.map(c => c.ReportConfigID),
        })}
        currentPrimaryName={currentPrimaryName}
        activeConfigName={activeConfigName}
        activeConfigId={activeConfigId}
        savedConfigRecord={savedConfigRecord}
        allTemplates={allTemplates}
        isTemplateAdmin={isTemplateAdmin}
        allPlans={allPlans}
        liveState={{
          ExhibitTemplateID: exhibitTemplateId,
          BulkRun: includeInBulk,
          BulkTierOverrideID: bulkUnlocked ? bulkTierOverrideId : null,
          BulkPctThresholdID: bulkUnlocked ? bulkPctThresholdId : null,
          AggregateFactSheets: aggregateFactSheets,
          ReplaceSpotlights: replaceSpotlights,
          SelectedConfigIDs: selectedConfigs.map(c => c.ReportConfigID),
        }}
      />
    </div>
  );
}
