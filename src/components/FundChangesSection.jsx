import { useState, useMemo } from 'react';
import { Checkbox, Tag, Space, Select, Alert } from 'antd';
import { SwapOutlined, DownOutlined, RightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { fundChangesInProgress, fundChangesExecuted } from '../data/mockData';

export default function FundChangesSection({
  includeFundChanges,
  setIncludeFundChanges,
  optInAll,
  setOptInAll,
  inProgressChecks,
  setInProgressChecks,
  executedChecks,
  setExecutedChecks,
  fundChangesInProgressData,
  fundChangesExecutedData,
  configType = 'single',
  plans = [],
  allFundChanges = [],
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // For multi plan: filter fund changes by selected plan
  const isMulti = configType === 'multi';
  const isCombo = configType === 'combo';

  // Determine which fund changes to show
  const { inProgressItems, executedItems } = useMemo(() => {
    if (isMulti && selectedPlanId) {
      const planChanges = allFundChanges.filter(fc => fc.ct_PlanID === selectedPlanId);
      return {
        inProgressItems: planChanges.filter(fc => fc.changeType === 'inProgress'),
        executedItems: planChanges.filter(fc => fc.changeType === 'executed'),
      };
    }
    if (isMulti && !selectedPlanId) {
      return { inProgressItems: [], executedItems: [] };
    }
    // Single plan — use passed-in data or static fallback
    return {
      inProgressItems: fundChangesInProgressData || fundChangesInProgress,
      executedItems: fundChangesExecutedData || fundChangesExecuted,
    };
  }, [isMulti, selectedPlanId, allFundChanges, fundChangesInProgressData, fundChangesExecutedData]);

  // Combo: fund changes are handled by child configs
  if (isCombo) {
    return (
      <div className="config-section">
        <div className="section-header">
          <h3>
            <SwapOutlined />
            Plan Fund Changes
          </h3>
        </div>
        <div className="section-body" style={{ padding: '12px 20px' }}>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="Fund changes are managed within the individual Single Plan and Consolidated configurations selected above. Each child config carries its own plan fund change selections."
            style={{ fontSize: 13 }}
          />
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return <Tag color="default">Pending</Tag>;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const checkedInProgress = Object.values(inProgressChecks).filter(Boolean).length;
  const checkedExecuted = Object.values(executedChecks).filter(Boolean).length;

  // Plan options for multi plan selector
  const planOptions = plans.map(p => ({ value: p.ct_PlanID, label: `${p.name} (${p.type})` }));

  // Count fund changes per plan for the dropdown labels
  const planFcCounts = useMemo(() => {
    if (!isMulti) return {};
    const counts = {};
    plans.forEach(p => {
      counts[p.ct_PlanID] = allFundChanges.filter(fc => fc.ct_PlanID === p.ct_PlanID).length;
    });
    return counts;
  }, [isMulti, plans, allFundChanges]);

  const planOptionsWithCount = isMulti
    ? plans.map(p => ({
        value: p.ct_PlanID,
        label: `${p.name} (${p.type}) — ${planFcCounts[p.ct_PlanID] || 0} changes`,
      }))
    : [];

  return (
    <div className="config-section">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <h3>
          <SwapOutlined />
          Plan Fund Changes
          {includeFundChanges && (
            <Tag style={{ marginLeft: 8, fontSize: 11 }}>
              {checkedInProgress + checkedExecuted} selected
            </Tag>
          )}
        </h3>
        {expanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
      </div>
      {expanded && (
        <div className="section-body">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space size="large">
              <Checkbox
                checked={includeFundChanges}
                onChange={(e) => setIncludeFundChanges(e.target.checked)}
              >
                <strong>Include Plan Fund Changes</strong>
              </Checkbox>
              <Checkbox
                checked={optInAll}
                onChange={(e) => {
                  setOptInAll(e.target.checked);
                  if (e.target.checked) {
                    if (isMulti) {
                      // Opt in to all fund changes across all selected plans
                      const allInProgress = allFundChanges.filter(fc =>
                        plans.some(p => p.ct_PlanID === fc.ct_PlanID) && fc.changeType === 'inProgress'
                      );
                      const allExecuted = allFundChanges.filter(fc =>
                        plans.some(p => p.ct_PlanID === fc.ct_PlanID) && fc.changeType === 'executed'
                      );
                      setInProgressChecks(prev => ({
                        ...prev,
                        ...Object.fromEntries(allInProgress.map(f => [f.id, true])),
                      }));
                      setExecutedChecks(prev => ({
                        ...prev,
                        ...Object.fromEntries(allExecuted.map(f => [f.id, true])),
                      }));
                    } else {
                      setInProgressChecks(Object.fromEntries(inProgressItems.map(f => [f.id, true])));
                      setExecutedChecks(Object.fromEntries(executedItems.map(f => [f.id, true])));
                    }
                  }
                }}
                disabled={!includeFundChanges}
              >
                Opt in to all Plan Fund Changes
              </Checkbox>
            </Space>

            {/* Multi plan: plan selector */}
            {isMulti && includeFundChanges && (
              <div>
                <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
                  Select a plan to view and manage its fund changes:
                </div>
                <Select
                  value={selectedPlanId}
                  onChange={setSelectedPlanId}
                  placeholder="Select a plan..."
                  style={{ width: 400 }}
                  options={planOptionsWithCount}
                  showSearch
                  filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                />
                {plans.length === 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                    message="No plans selected. Add plans to the multi plan configuration to manage fund changes."
                  />
                )}
              </div>
            )}

            {includeFundChanges && (!isMulti || selectedPlanId) && (
              <>
                {isMulti && selectedPlanId && (
                  <div style={{ fontSize: 12, color: '#00437B', fontWeight: 600 }}>
                    Showing fund changes for: {plans.find(p => p.ct_PlanID === selectedPlanId)?.name || `Plan ${selectedPlanId}`}
                  </div>
                )}

                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#00437B' }}>
                    Fund changes in progress
                  </div>
                  {inProgressItems.length > 0 ? (
                    <table className="fund-change-table">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>Inc?</th>
                          <th>Current Investment</th>
                          <th style={{ width: 50 }}>%</th>
                          <th>Replacement Investment</th>
                          <th style={{ width: 120 }}>Effective</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inProgressItems.map(fc => (
                          <tr key={fc.id}>
                            <td>
                              <Checkbox
                                checked={inProgressChecks[fc.id]}
                                onChange={(e) => setInProgressChecks(prev => ({
                                  ...prev, [fc.id]: e.target.checked
                                }))}
                              />
                            </td>
                            <td>{fc.currentFund}</td>
                            <td>{fc.percentage}</td>
                            <td>{fc.replacementFund}</td>
                            <td>{formatDate(fc.effectiveDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ fontSize: 12, color: '#8c8c8c', padding: '4px 0' }}>
                      No in-progress fund changes for this plan.
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#52c41a' }}>
                    Fund changes executed in the past year
                  </div>
                  {executedItems.length > 0 ? (
                    <table className="fund-change-table">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>Inc?</th>
                          <th>Current Investment</th>
                          <th style={{ width: 50 }}>%</th>
                          <th>Replacement Investment</th>
                          <th style={{ width: 120 }}>Effective</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executedItems.map(fc => (
                          <tr key={fc.id}>
                            <td>
                              <Checkbox
                                checked={executedChecks[fc.id]}
                                onChange={(e) => setExecutedChecks(prev => ({
                                  ...prev, [fc.id]: e.target.checked
                                }))}
                              />
                            </td>
                            <td>{fc.currentFund}</td>
                            <td>{fc.percentage}</td>
                            <td>{fc.replacementFund}</td>
                            <td>{formatDate(fc.effectiveDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ fontSize: 12, color: '#8c8c8c', padding: '4px 0' }}>
                      No executed fund changes for this plan.
                    </div>
                  )}
                </div>
              </>
            )}
          </Space>
        </div>
      )}
    </div>
  );
}
