import { useState, useMemo } from 'react';
import { Button, Checkbox, Space, Modal, Tag, Alert, Select } from 'antd';
import {
  AppstoreOutlined,
  DownOutlined,
  RightOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  SwapOutlined,
} from '@ant-design/icons';

export default function ManagerGroupsSection({
  configType,
  includeCandidates,
  setIncludeCandidates,
  groups,
  setGroups,
  planInvestments = [],
  allCandidates = [],
  selectedCandidateIds,
  setSelectedCandidateIds,
  plans = [],
}) {
  // Combo: asset class managers are managed within child configs
  if (configType === 'combo') {
    return (
      <div className="config-section">
        <div className="section-header">
          <h3>
            <AppstoreOutlined />
            Asset Class / Manager Groups
          </h3>
        </div>
        <div className="section-body" style={{ padding: '12px 20px' }}>
          <Alert
            type="info"
            showIcon
            message="Asset class and manager group settings are managed within the individual Single Plan and Multi Plan configurations selected above."
            style={{ fontSize: 13 }}
          />
        </div>
      </div>
    );
  }

  const [expanded, setExpanded] = useState(false);
  const [customTiersEnabled, setCustomTiersEnabled] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(
    Object.fromEntries(groups.map(g => [g.id, true]))
  );
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [selectedInvestmentRef, setSelectedInvestmentRef] = useState(null);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleAddGroup = () => {
    const newId = `group-${Date.now()}`;
    setGroups([...groups, {
      id: newId,
      name: `Group ${groups.length + 1}`,
      customName: 'New Group',
      managers: [],
    }]);
    setExpandedGroups(prev => ({ ...prev, [newId]: true }));
  };

  const totalManagers = groups.reduce((sum, g) => sum + g.managers.length, 0);

  // Unified investment list (deduplicated by name) — only those with candidates mapped
  const investmentCandidateMap = useMemo(() => {
    const seen = new Set();
    const uniqueInvestments = [];
    planInvestments.forEach(inv => {
      if (!seen.has(inv.Ref)) {
        seen.add(inv.Ref);
        uniqueInvestments.push(inv.Ref);
      }
    });
    return uniqueInvestments
      .map(investmentName => {
        const candidates = allCandidates.filter(c => c.replacesRef === investmentName);
        return { investmentName, candidates };
      })
      .filter(item => item.candidates.length > 0)
      .sort((a, b) => a.investmentName.localeCompare(b.investmentName));
  }, [planInvestments, allCandidates]);

  // All unique investments for the dropdown (including those without candidates, for context)
  const investmentOptions = useMemo(() => {
    return investmentCandidateMap.map(item => ({
      value: item.investmentName,
      label: `${item.investmentName}  (${item.candidates.length} candidate${item.candidates.length !== 1 ? 's' : ''})`,
    }));
  }, [investmentCandidateMap]);

  // Candidates for the currently selected investment
  const candidatesForSelected = useMemo(() => {
    if (!selectedInvestmentRef) return [];
    const entry = investmentCandidateMap.find(i => i.investmentName === selectedInvestmentRef);
    return entry ? entry.candidates : [];
  }, [selectedInvestmentRef, investmentCandidateMap]);

  // Plans that contain the selected investment
  const plansForSelected = useMemo(() => {
    if (!selectedInvestmentRef) return [];
    return planInvestments.filter(inv => inv.Ref === selectedInvestmentRef);
  }, [selectedInvestmentRef, planInvestments]);

  const totalSelectedCount = selectedCandidateIds.size;

  const toggleCandidate = (candidateId) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  };

  const selectAllForInvestment = () => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      candidatesForSelected.forEach(c => next.add(c.ct_investmentid));
      return next;
    });
  };

  const deselectAllForInvestment = () => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      candidatesForSelected.forEach(c => next.delete(c.ct_investmentid));
      return next;
    });
  };

  const handleOpenModal = () => {
    // Auto-select the first investment with candidates if none selected
    if (!selectedInvestmentRef && investmentCandidateMap.length > 0) {
      setSelectedInvestmentRef(investmentCandidateMap[0].investmentName);
    }
    setCandidateModalOpen(true);
  };

  const handleApplyCandidates = () => {
    setCandidateModalOpen(false);
  };

  // Count how many candidates are selected for each investment (for the summary)
  const selectionSummary = useMemo(() => {
    return investmentCandidateMap.map(item => {
      const selectedCount = item.candidates.filter(c => selectedCandidateIds.has(c.ct_investmentid)).length;
      return { investmentName: item.investmentName, selectedCount, totalCount: item.candidates.length };
    }).filter(s => s.selectedCount > 0);
  }, [investmentCandidateMap, selectedCandidateIds]);

  return (
    <div className="config-section">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <h3>
          <AppstoreOutlined />
          Asset Class | Managers
          <Tag style={{ marginLeft: 8, fontSize: 11 }}>
            {groups.length} groups, {totalManagers} managers
          </Tag>
          {includeCandidates && totalSelectedCount > 0 && (
            <Tag color="orange" style={{ marginLeft: 4, fontSize: 11 }}>
              {totalSelectedCount} candidate{totalSelectedCount !== 1 ? 's' : ''}
            </Tag>
          )}
        </h3>
        {expanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
      </div>
      {expanded && (
        <div className="section-body">
          <Space size="large" style={{ marginBottom: 16 }}>
            <Checkbox
              checked={includeCandidates}
              onChange={(e) => {
                setIncludeCandidates(e.target.checked);
                if (e.target.checked) handleOpenModal();
              }}
            >
              <strong>Include Candidate Investments</strong>
            </Checkbox>
            {includeCandidates && (
              <Button
                size="small"
                icon={<ExperimentOutlined />}
                onClick={handleOpenModal}
              >
                Manage Candidates ({totalSelectedCount} selected)
              </Button>
            )}
          </Space>

          {/* Summary of selected candidates when checked */}
          {includeCandidates && selectionSummary.length > 0 && (
            <div style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 6,
              padding: '10px 16px',
              marginBottom: 16,
              fontSize: 12,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: '#d48806' }}>
                <ExperimentOutlined style={{ marginRight: 6 }} />
                Selected Candidates
              </div>
              {selectionSummary.map(s => (
                <div key={s.investmentName} style={{ marginLeft: 20, marginBottom: 2 }}>
                  <SwapOutlined style={{ marginRight: 6, fontSize: 10, color: '#8c8c8c' }} />
                  <strong>{s.investmentName}</strong>
                  <span style={{ color: '#8c8c8c' }}> — {s.selectedCount} of {s.totalCount} candidate{s.totalCount !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Client Custom Tiers */}
          <div style={{
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 16,
            marginBottom: 16,
          }}>
            <Checkbox
              checked={customTiersEnabled}
              onChange={(e) => setCustomTiersEnabled(e.target.checked)}
            >
              <strong>Client Custom Tiers</strong>
            </Checkbox>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, marginLeft: 24 }}>
              Group investments into custom tiers for presentation ordering.
              When enabled, define how investments are organized and ordered in reports.
            </div>

            {customTiersEnabled && (
              <div style={{ marginTop: 16, marginLeft: 8 }}>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
                  Investment groupings define how managers are organized in reports.
                </div>

                {groups.map(group => (
                  <div key={group.id} className="manager-group">
                    <div
                      className="group-header"
                      onClick={() => toggleGroup(group.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Space>
                        {expandedGroups[group.id] ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
                        <span>{group.name} ({group.customName})</span>
                        <Tag style={{ fontSize: 11 }}>{group.managers.length} managers</Tag>
                      </Space>
                      <Space size="small">
                        <Button size="small" icon={<EditOutlined />} type="text" onClick={(e) => e.stopPropagation()} />
                        <Button size="small" icon={<DeleteOutlined />} type="text" danger onClick={(e) => e.stopPropagation()} />
                      </Space>
                    </div>
                    {expandedGroups[group.id] && (
                      <div>
                        {group.managers.length > 0 ? (
                          <>
                            <div className="manager-row" style={{ background: '#fafafa', fontWeight: 600, fontSize: 12, color: '#8c8c8c' }}>
                              <div>Asset Class</div>
                              <div>Fund / Manager</div>
                            </div>
                            {group.managers
                              .filter(m => includeCandidates || !m.isCandidate)
                              .map(manager => (
                                <div key={manager.id} className={`manager-row ${manager.isCandidate ? 'candidate' : ''}`}>
                                  <div className="asset-class">
                                    {manager.assetClass}
                                    {manager.isCandidate && (
                                      <Tag color="orange" style={{ marginLeft: 6, fontSize: 10 }}>Candidate</Tag>
                                    )}
                                  </div>
                                  <div className="fund-name">{manager.fund}</div>
                                </div>
                              ))
                            }
                          </>
                        ) : (
                          <div style={{ padding: 16, color: '#8c8c8c', fontSize: 13, textAlign: 'center' }}>
                            No managers in this group
                          </div>
                        )}
                        <div style={{ padding: '8px 14px', borderTop: '1px solid #f0f0f0' }}>
                          <Button size="small" type="dashed" icon={<PlusOutlined />}>
                            Add manager to group
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddGroup}>
                  Create new group
                </Button>
              </div>
            )}
          </div>

          {/* Candidate Investment Modal */}
          <Modal
            title={
              <Space>
                <ExperimentOutlined style={{ color: '#d48806' }} />
                Candidate Investments
              </Space>
            }
            open={candidateModalOpen}
            onCancel={() => setCandidateModalOpen(false)}
            onOk={handleApplyCandidates}
            okText="Apply"
            width={720}
          >
            <p style={{ color: '#8c8c8c', marginBottom: 16, fontSize: 13 }}>
              Select an investment to compare against, then choose which candidate alternatives to include in the report.
              Candidates appear as unfunded alternatives across all plans where that investment exists.
            </p>

            {investmentCandidateMap.length === 0 ? (
              <div style={{
                background: '#fafafa',
                border: '1px dashed #d9d9d9',
                borderRadius: 6,
                padding: 32,
                textAlign: 'center',
                color: '#8c8c8c',
                fontSize: 13,
              }}>
                No candidate investments have been mapped to investments in this configuration's plans.
                <br />
                <span style={{ fontSize: 12 }}>
                  Use the Demo Data admin to create candidates and map them to investments via the "Compared Against" field.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16, minHeight: 300 }}>
                {/* Left panel: investment selector */}
                <div style={{ width: 240, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Investments with Candidates
                  </div>
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                    {investmentCandidateMap.map(item => {
                      const isActive = selectedInvestmentRef === item.investmentName;
                      const selectedForThis = item.candidates.filter(c => selectedCandidateIds.has(c.ct_investmentid)).length;
                      return (
                        <div
                          key={item.investmentName}
                          onClick={() => setSelectedInvestmentRef(item.investmentName)}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            background: isActive ? '#edf6fb' : 'white',
                            borderBottom: '1px solid #f5f5f5',
                            borderLeft: isActive ? '3px solid #00437B' : '3px solid transparent',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                            {item.investmentName}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Tag style={{ fontSize: 10, margin: 0 }}>
                              {item.candidates.length} candidate{item.candidates.length !== 1 ? 's' : ''}
                            </Tag>
                            {selectedForThis > 0 && (
                              <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>
                                {selectedForThis} selected
                              </Tag>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right panel: candidates for selected investment */}
                <div style={{ flex: 1 }}>
                  {!selectedInvestmentRef ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#8c8c8c',
                      fontSize: 13,
                    }}>
                      Select an investment from the left to view its candidates
                    </div>
                  ) : (
                    <div>
                      {/* Header */}
                      <div style={{
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                        borderRadius: '6px 6px 0 0',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {selectedInvestmentRef}
                          </div>
                          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                            Present in {plansForSelected.length} plan{plansForSelected.length !== 1 ? 's' : ''}
                            {plansForSelected.length <= 5 && plansForSelected.length > 0 && (
                              <span> — {[...new Set(plansForSelected.map(inv => {
                                const p = plans.find(pl => pl.ct_PlanID === inv.ct_PlanID);
                                return p ? p.name : `Plan ${inv.ct_PlanID}`;
                              }))].join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <Space size="small">
                          <Button size="small" type="link" onClick={selectAllForInvestment}>
                            Select All
                          </Button>
                          <Button size="small" type="link" onClick={deselectAllForInvestment}>
                            Clear
                          </Button>
                        </Space>
                      </div>

                      {/* Candidate list */}
                      <div style={{ border: '1px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
                        <div style={{
                          padding: '6px 14px',
                          background: '#fafafa',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#8c8c8c',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <div style={{ width: 28 }}></div>
                          <div style={{ flex: 1 }}>Candidate Fund</div>
                          <div style={{ width: 80, textAlign: 'center' }}>Status</div>
                        </div>

                        {candidatesForSelected.map(cand => {
                          const isSelected = selectedCandidateIds.has(cand.ct_investmentid);
                          return (
                            <div
                              key={cand.ct_investmentid}
                              onClick={() => toggleCandidate(cand.ct_investmentid)}
                              style={{
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                borderBottom: '1px solid #fafafa',
                                background: isSelected ? '#fff7e6' : 'white',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => toggleCandidate(cand.ct_investmentid)}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>
                                  {cand.Ref}
                                </div>
                              </div>
                              <div style={{ width: 80, textAlign: 'center' }}>
                                {isSelected ? (
                                  <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>Included</Tag>
                                ) : (
                                  <Tag style={{ fontSize: 10, margin: 0, color: '#bfbfbf' }}>Available</Tag>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {candidatesForSelected.length === 0 && (
                          <div style={{ padding: 20, textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
                            No candidates mapped to this investment
                          </div>
                        )}
                      </div>

                      {/* Info about cross-plan applicability */}
                      {plansForSelected.length > 1 && (
                        <Alert
                          type="info"
                          showIcon
                          style={{ marginTop: 10, fontSize: 12 }}
                          message={`Selected candidates will appear in all ${plansForSelected.length} plans that include ${selectedInvestmentRef}.`}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom summary */}
            {totalSelectedCount > 0 && (
              <div style={{
                marginTop: 16,
                padding: '8px 12px',
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: 6,
                fontSize: 12,
                color: '#d48806',
              }}>
                <strong>{totalSelectedCount}</strong> candidate{totalSelectedCount !== 1 ? 's' : ''} selected
                across <strong>{selectionSummary.length}</strong> investment{selectionSummary.length !== 1 ? 's' : ''}
              </div>
            )}
          </Modal>
        </div>
      )}
    </div>
  );
}
