import { useState, useMemo, useEffect, useRef } from 'react';
import { Select, Button, Input, Modal, Table, Tag, Space, Checkbox, Popconfirm, message } from 'antd';
import { TeamOutlined, FilterOutlined, SaveOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, CopyOutlined } from '@ant-design/icons';
import { fundChangesInProgress, fundChangesExecuted } from '../data/mockData';
import DualListBox from './DualListBox';
import FundChangesSection from './FundChangesSection';
import ManagerGroupsSection from './ManagerGroupsSection';
import ExhibitMenuSection from './ExhibitMenuSection';
import BulkRunSection from './BulkRunSection';
import SaveConfigSection from './SaveConfigSection';

const emptyManagerGroups = [
  { id: 'default', name: 'Default Group', managers: [], customTier: null },
];

export default function MultiPlanConfig({
  period,
  plans = [],
  allPlanGroups = [],
  clientAccountId,
  onSavePlanGroup,
  onUpdatePlanGroup,
  onRenamePlanGroup,
  onDeletePlanGroup,
  onSaveConfig,
  activeConfigName,
  activeConfigId,
  currentPrimaryName,
  savedConfigRecord,
  allTemplates,
  allConfigs,
  onSaveTemplate,
  onUpdateTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  loadedConfig,
  allFundChanges = [],
  allInvestments = [],
  allCandidates = [],
  isTemplateAdmin = false,
  allPlans = [],
}) {
  const lastToastedConfigRef = useRef(null);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([...plans]);
  const [filterType, setFilterType] = useState(null);
  const [filterVendor, setFilterVendor] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [loadGroupModalOpen, setLoadGroupModalOpen] = useState(false);
  const [includeIndividualSummaries, setIncludeIndividualSummaries] = useState(false);
  const [qdiaOptOut, setQdiaOptOut] = useState(false);

  // Track active (loaded) plan group
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeGroupName, setActiveGroupName] = useState(null);

  // Track plan selection at last save/load to detect plan group changes
  const [savedPlanIds, setSavedPlanIds] = useState([]);

  // Rename state for modal
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Fund changes state — default to unchecked when no config is loaded
  const [includeFundChanges, setIncludeFundChanges] = useState(false);
  const [optInAllFundChanges, setOptInAllFundChanges] = useState(false);
  const [inProgressChecks, setInProgressChecks] = useState(
    Object.fromEntries(fundChangesInProgress.map(f => [f.id, false]))
  );
  const [executedChecks, setExecutedChecks] = useState(
    Object.fromEntries(fundChangesExecuted.map(f => [f.id, false]))
  );

  // Managers state
  const [includeCandidates, setIncludeCandidates] = useState(false);
  const [managerGroups, setManagerGroups] = useState(emptyManagerGroups);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());

  // Exhibit state (lifted)
  const [selectedExhibitIds, setSelectedExhibitIds] = useState([]);
  const [exhibitTemplateName, setExhibitTemplateName] = useState(null);
  const [exhibitTemplateId, setExhibitTemplateId] = useState(null);
  const [exhibitCategoryId, setExhibitCategoryId] = useState(1);

  // Bulk run state (lifted)
  const [includeInBulk, setIncludeInBulk] = useState(true);
  const [bulkUnlocked, setBulkUnlocked] = useState(false);
  const [bulkTierOverrideId, setBulkTierOverrideId] = useState(null);
  const [bulkPctThresholdId, setBulkPctThresholdId] = useState(null);

  // --- Restore state from loaded config (auto-load or manual load) ---
  useEffect(() => {
    if (!loadedConfig) return;
    setQdiaOptOut(loadedConfig.qdiaOptOut ?? false);
    setIncludeFundChanges(loadedConfig.includeFundChanges ?? false);
    setOptInAllFundChanges(loadedConfig.optInAllFundChanges ?? false);
    setInProgressChecks(loadedConfig.fundChangesInProgressChecks ??
      Object.fromEntries(fundChangesInProgress.map(f => [f.id, false]))
    );
    setExecutedChecks(loadedConfig.fundChangesExecutedChecks ??
      Object.fromEntries(fundChangesExecuted.map(f => [f.id, false]))
    );
    setIncludeCandidates(loadedConfig.includeCandidates ?? false);
    setSelectedExhibitIds(loadedConfig.selectedExhibitIds ?? []);
    setExhibitTemplateName(loadedConfig.exhibitTemplateName ?? null);
    setExhibitTemplateId(loadedConfig.exhibitTemplate?.ExhibitTemplateID ?? null);
    setExhibitCategoryId(loadedConfig.exhibitCategoryId ?? 1);
    setIncludeInBulk(loadedConfig.includeInBulk ?? true);
    setBulkUnlocked(loadedConfig.bulkUnlocked ?? false);
    setBulkTierOverrideId(loadedConfig.bulkTierOverrideId ?? null);
    setBulkPctThresholdId(loadedConfig.bulkPctThresholdId ?? null);

    // Restore plan group if saved with the config
    if (loadedConfig._planIds && loadedConfig._planIds.length > 0) {
      const groupPlans = plans.filter(p => loadedConfig._planIds.includes(p.ct_PlanID));
      const remaining = plans.filter(p => !loadedConfig._planIds.includes(p.ct_PlanID));
      setSelectedPlans(groupPlans);
      setAvailablePlans(remaining);
      setSavedPlanIds(loadedConfig._planIds);
      if (loadedConfig._planGroupId) {
        setActiveGroupId(loadedConfig._planGroupId);
        setActiveGroupName(loadedConfig._planGroupName || null);
        setGroupName(loadedConfig._planGroupName || '');
      }
    }

    const toastKey = loadedConfig.ReportConfigID || loadedConfig._loadTimestamp || JSON.stringify(loadedConfig);
    if (!loadedConfig._autoLoad && lastToastedConfigRef.current !== toastKey) {
      lastToastedConfigRef.current = toastKey;
      const parts = ['Report configuration'];
      if (loadedConfig.exhibitTemplateName) parts.push(`exhibit template "${loadedConfig.exhibitTemplateName}"`);
      message.success(`${parts.join(' and ')} loaded`);
    }
  }, [loadedConfig]);

  // Build report plans with investments and fund changes for the Run Now preview
  const reportPlans = useMemo(() =>
    selectedPlans.map(p => {
      const planChanges = allFundChanges.filter(fc => fc.ct_PlanID === p.ct_PlanID);
      const planInvNames = new Set(allInvestments.filter(inv => inv.ct_PlanID === p.ct_PlanID).map(inv => inv.Ref));
      const planCandidates = includeCandidates
        ? allCandidates
            .filter(c => c.replacesRef && planInvNames.has(c.replacesRef))
            .filter(c => selectedCandidateIds.has(c.ct_investmentid))
        : [];
      return {
        ...p,
        investments: allInvestments.filter(inv => inv.ct_PlanID === p.ct_PlanID),
        fundChanges: {
          inProgress: planChanges.filter(fc => fc.changeType === 'inProgress' && inProgressChecks[fc.id]),
          executed: planChanges.filter(fc => fc.changeType === 'executed' && executedChecks[fc.id]),
        },
        candidates: planCandidates,
      };
    }),
    [selectedPlans, allInvestments, allFundChanges, inProgressChecks, executedChecks, allCandidates, includeCandidates, selectedCandidateIds]
  );

  // Aggregate fund changes across selected plans
  const multiPlanFundChanges = useMemo(() => {
    const planIds = new Set(selectedPlans.map(p => p.ct_PlanID));
    const relevant = allFundChanges.filter(fc => planIds.has(fc.ct_PlanID));
    return {
      inProgress: relevant.filter(fc => fc.changeType === 'inProgress'),
      executed: relevant.filter(fc => fc.changeType === 'executed'),
    };
  }, [selectedPlans, allFundChanges]);

  const vendors = useMemo(() => [...new Set(plans.map(p => p.vendor))], []);
  const planTypes = useMemo(() => [...new Set(plans.map(p => p.type))], []);

  const filteredAvailable = useMemo(() => {
    return availablePlans.filter(p => {
      if (filterType && p.type !== filterType) return false;
      if (filterVendor && p.vendor !== filterVendor) return false;
      return true;
    });
  }, [availablePlans, filterType, filterVendor]);

  const handlePlanListChange = (newSelected, newAvailable) => {
    setSelectedPlans(newSelected);
    const filteredAvailableIds = new Set(filteredAvailable.map(p => p.ct_PlanID));
    const hiddenPlans = availablePlans.filter(p => !filteredAvailableIds.has(p.ct_PlanID));
    setAvailablePlans([...hiddenPlans, ...newAvailable]);
  };

  const handleLoadGroup = (group) => {
    const groupPlans = plans.filter(p => group.ct_PlanIDs.includes(p.ct_PlanID));
    const remaining = plans.filter(p => !group.ct_PlanIDs.includes(p.ct_PlanID));
    setSelectedPlans(groupPlans);
    setAvailablePlans(remaining);
    setGroupName(group.ReportPlanGroupName);
    setActiveGroupId(group.ReportPlanGroupID);
    setActiveGroupName(group.ReportPlanGroupName);
    setSavedPlanIds(group.ct_PlanIDs);
    setLoadGroupModalOpen(false);
    message.success(`Loaded plan group: ${group.ReportPlanGroupName}`);
  };

  // Save new plan group
  const handleSaveNewGroup = () => {
    if (!groupName.trim() || selectedPlans.length === 0) return;
    const newGroup = {
      ReportPlanGroupID: Date.now(),
      ReportPlanGroupName: groupName.trim(),
      ct_PlanIDs: selectedPlans.map(p => p.ct_PlanID),
      AccountID: clientAccountId,
    };
    if (onSavePlanGroup) onSavePlanGroup(newGroup);
    setActiveGroupId(newGroup.ReportPlanGroupID);
    setActiveGroupName(newGroup.ReportPlanGroupName);
    setSavedPlanIds(selectedPlans.map(p => p.ct_PlanID));
    message.success(`Saved plan group: ${groupName.trim()}`);
  };

  // Update existing plan group in-place
  const handleUpdateGroup = () => {
    if (!activeGroupId || selectedPlans.length === 0) return;
    if (onUpdatePlanGroup) onUpdatePlanGroup(activeGroupId, selectedPlans.map(p => p.ct_PlanID));
    setSavedPlanIds(selectedPlans.map(p => p.ct_PlanID));
    message.success(`Updated plan group: ${activeGroupName}`);
  };

  // Save As new group
  const handleSaveAsGroup = () => {
    if (!groupName.trim() || selectedPlans.length === 0) return;
    const newGroup = {
      ReportPlanGroupID: Date.now(),
      ReportPlanGroupName: groupName.trim(),
      ct_PlanIDs: selectedPlans.map(p => p.ct_PlanID),
      AccountID: clientAccountId,
    };
    if (onSavePlanGroup) onSavePlanGroup(newGroup);
    setActiveGroupId(newGroup.ReportPlanGroupID);
    setActiveGroupName(newGroup.ReportPlanGroupName);
    setSavedPlanIds(selectedPlans.map(p => p.ct_PlanID));
    message.success(`Saved new plan group: ${groupName.trim()}`);
  };

  // Rename in modal
  const startRename = (record, e) => {
    e.stopPropagation();
    setRenamingId(record.ReportPlanGroupID);
    setRenameValue(record.ReportPlanGroupName);
  };
  const confirmRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) { message.warning('Group name cannot be empty'); return; }
    if (onRenamePlanGroup) onRenamePlanGroup(renamingId, trimmed);
    if (activeGroupId === renamingId) {
      setActiveGroupName(trimmed);
      setGroupName(trimmed);
    }
    message.success('Plan group renamed');
    setRenamingId(null);
    setRenameValue('');
  };
  const cancelRename = () => { setRenamingId(null); setRenameValue(''); };

  // Delete in modal
  const handleDeleteGroup = (groupId) => {
    if (onDeletePlanGroup) onDeletePlanGroup(groupId);
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
      setActiveGroupName(null);
    }
    message.success('Plan group deleted');
  };

  const groupColumns = [
    {
      title: 'Group Name',
      dataIndex: 'ReportPlanGroupName',
      key: 'name',
      render: (text, record) => {
        if (renamingId === record.ReportPlanGroupID) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                size="small"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onPressEnter={confirmRename}
                onKeyDown={(e) => { if (e.key === 'Escape') cancelRename(); }}
                autoFocus
                style={{ flex: 1 }}
              />
              <Button type="text" size="small" icon={<CheckOutlined style={{ color: '#52c41a', fontSize: 13 }} />} onClick={confirmRename} />
              <Button type="text" size="small" icon={<CloseOutlined style={{ color: '#ff4d4f', fontSize: 13 }} />} onClick={cancelRename} />
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong style={{ flex: 1 }}>{text}</strong>
            <EditOutlined
              style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer', flexShrink: 0 }}
              onClick={(e) => startRename(record, e)}
            />
          </div>
        );
      },
    },
    {
      title: 'Plans',
      dataIndex: 'ct_PlanIDs',
      key: 'plans',
      width: 180,
      render: (ids) => {
        const names = ids.map(id => {
          const p = plans.find(dp => dp.ct_PlanID === id);
          return p ? p.name : `Plan ${id}`;
        });
        return (
          <span style={{ fontSize: 12 }}>
            {names.length <= 2
              ? names.join(', ')
              : `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
            }
          </span>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 130,
      render: (_, record) => (
        <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button type="primary" size="small" onClick={() => handleLoadGroup(record)}>Load</Button>
          <Popconfirm
            title="Delete this plan group?"
            description={`"${record.ReportPlanGroupName}" will be removed.`}
            onConfirm={() => handleDeleteGroup(record.ReportPlanGroupID)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Plan Selection */}
      <div className="config-section">
        <div className="section-header">
          <h3>
            <TeamOutlined />
            Plans Included
            {activeGroupName && (
              <Tag color="cyan" style={{ marginLeft: 8, fontSize: 11 }}>
                {activeGroupName}
              </Tag>
            )}
          </h3>
        </div>
        <div className="section-body">
          {/* Filters */}
          <Space style={{ marginBottom: 16 }}>
            <FilterOutlined style={{ color: '#8c8c8c' }} />
            <Select
              placeholder="Filter by Plan Type"
              value={filterType}
              onChange={setFilterType}
              allowClear
              style={{ width: 180 }}
              options={planTypes.map(t => ({ value: t, label: t }))}
            />
            <Select
              placeholder="Filter by Vendor"
              value={filterVendor}
              onChange={setFilterVendor}
              allowClear
              style={{ width: 180 }}
              options={vendors.map(v => ({ value: v, label: v }))}
            />
            <Button onClick={() => setLoadGroupModalOpen(true)}>
              Load Plan Group
            </Button>
          </Space>

          <DualListBox
            selectedItems={selectedPlans}
            availableItems={filteredAvailable}
            onSelectedChange={handlePlanListChange}
            selectedTitle="Selected Plans"
            availableTitle="Available Plans"
            renderItem={(plan) => (
              <span>
                {plan.name}
                <Tag style={{ marginLeft: 8, fontSize: 10 }}>{plan.type}</Tag>
              </span>
            )}
          />

          {/* Save / Save As plan group */}
          <div className="section-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {activeGroupId ? (
              <>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  size="small"
                  onClick={handleUpdateGroup}
                  disabled={selectedPlans.length === 0}
                >
                  Save Group
                </Button>
                <div style={{ borderLeft: '1px solid #d9d9d9', height: 20 }} />
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Save As New:</span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Save Plan Group:</span>
            )}
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={activeGroupId ? 'New group name...' : 'e.g., All DC Plans'}
              style={{ width: 220 }}
              size="small"
              onPressEnter={activeGroupId ? handleSaveAsGroup : handleSaveNewGroup}
            />
            <Button
              icon={<SaveOutlined />}
              size="small"
              onClick={activeGroupId ? handleSaveAsGroup : handleSaveNewGroup}
              disabled={!groupName.trim() || selectedPlans.length === 0}
            >
              {activeGroupId ? 'Save As New' : 'Save'}
            </Button>
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
        </div>
      </div>

      {/* --- Included Investments Group --- */}
      <div style={{ borderLeft: '3px solid #00437B', paddingLeft: 16, marginBottom: 8, marginTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00437B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Included Investments
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
          Control which investments appear in the report — fund changes and candidate comparisons
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
          configType="multi"
          plans={selectedPlans}
          allFundChanges={allFundChanges}
        />
        <ManagerGroupsSection
          includeCandidates={includeCandidates}
          setIncludeCandidates={setIncludeCandidates}
          groups={managerGroups}
          setGroups={setManagerGroups}
          planInvestments={allInvestments.filter(inv => selectedPlans.some(p => p.ct_PlanID === inv.ct_PlanID))}
          allCandidates={allCandidates}
          selectedCandidateIds={selectedCandidateIds}
          setSelectedCandidateIds={setSelectedCandidateIds}
          plans={selectedPlans}
        />
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
          configType="multi"
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
          includeIndividualSummaries={includeIndividualSummaries}
          setIncludeIndividualSummaries={setIncludeIndividualSummaries}
          isTemplateAdmin={isTemplateAdmin}
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
        configType="multi"
        qdiaOptOut={qdiaOptOut}
        reportPlans={reportPlans}
        planGroupChanged={(() => {
          const currentIds = selectedPlans.map(p => p.ct_PlanID).sort();
          const saved = [...savedPlanIds].sort();
          return JSON.stringify(currentIds) !== JSON.stringify(saved);
        })()}
        planGroupName={activeGroupName}
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
          _planGroupId: activeGroupId,
          _planGroupName: activeGroupName,
          _planIds: selectedPlans.map(p => p.ct_PlanID),
        })}
        currentPrimaryName={currentPrimaryName}
        activeConfigName={activeConfigName}
        activeConfigId={activeConfigId}
        savedConfigRecord={savedConfigRecord}
        allTemplates={allTemplates}
        isTemplateAdmin={isTemplateAdmin}
        allPlans={allPlans}
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

      {/* Load Plan Group Modal */}
      <Modal
        title="Load Saved Plan Group"
        open={loadGroupModalOpen}
        onCancel={() => { setLoadGroupModalOpen(false); setRenamingId(null); }}
        footer={null}
        width={600}
      >
        <p style={{ color: '#8c8c8c', marginBottom: 16, fontSize: 13 }}>
          Select a previously saved plan grouping to load. You can also rename or delete groups.
        </p>
        {allPlanGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
            No saved plan groups yet. Select plans and save a group to get started.
          </div>
        ) : (
          <Table
            dataSource={allPlanGroups}
            columns={groupColumns}
            rowKey="ReportPlanGroupID"
            size="small"
            pagination={false}
          />
        )}
      </Modal>
    </div>
  );
}
