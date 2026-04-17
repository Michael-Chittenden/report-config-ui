import { useState, useMemo } from 'react';
import { Drawer, Tabs, Table, Button, Input, Select, Space, Tag, Popconfirm, Divider, Switch, Checkbox, Popover, message } from 'antd';
import { PlusOutlined, DeleteOutlined, ExperimentOutlined, DownloadOutlined, UploadOutlined, EditOutlined, CheckOutlined, CloseOutlined, LockOutlined, UnlockOutlined, HistoryOutlined, UnorderedListOutlined, PictureOutlined } from '@ant-design/icons';
import { pagesets as seedPagesets, pagesetCategories } from '../data/mockData';
import { compressImage } from '../utils/imageDb';
import changelogRaw from '../../CHANGELOG.md?raw';

const planTypes = ['DC', 'NQ', 'DB'];
const vendors = ['Vanguard', 'Fidelity', 'TIAA', 'Schwab'];
const assetClasses = [
  'Money Market', 'Stable Value', 'Intermediate Core Bond', 'Intermediate Core-Plus Bond',
  'Global Bond - USD Hedged', 'Target Date Retirement Income', 'Target Date 2025', 'Target Date 2030',
  'Target Date 2035', 'Target Date 2040', 'Target Date 2045', 'Target Date 2050', 'Target Date 2055',
  'Target Date 2060', 'Target Date 2065+', 'Large Company Value', 'Large Company Blend',
  'Large Company Growth', 'Medium Company Blend', 'Small Company Value', 'Small Company Growth',
  'Foreign Large Blend', 'Foreign Large Growth', 'Emerging Markets', 'Real Assets', 'Commodities', 'Loan',
];
const groupNames = ['Fixed Income', 'Target Date Funds', 'Core Equity', 'International', 'Alternatives', 'NQ Assets', 'DB Core'];

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default function MockDataAdmin({
  open,
  onClose,
  allClients,
  setAllClients,
  allPlans,
  setAllPlans,
  investments,
  setInvestments,
  candidates,
  setCandidates,
  allConfigs = [],
  setAllConfigs,
  allTemplates = [],
  setAllTemplates,
  allPlanGroups = [],
  setAllPlanGroups,
  allFundChanges = [],
  setAllFundChanges,
  isTemplateAdmin = false,
  setIsTemplateAdmin,
  exhibitImages = {},
  setExhibitImages,
  exhibitHeaders = {},
  setExhibitHeaders,
}) {
  // --- Inline edit state ---
  const [editingClientId, setEditingClientId] = useState(null);
  const [editingClientName, setEditingClientName] = useState('');
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingPlanName, setEditingPlanName] = useState('');

  // --- Clients ---
  const [newClientName, setNewClientName] = useState('');

  const handleAddClient = () => {
    const name = newClientName.trim();
    if (!name) return;
    if (allClients.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      message.warning('Client name already exists');
      return;
    }
    const newClient = { accountId: generateId(), name };
    setAllClients(prev => [...prev, newClient]);
    setNewClientName('');
    message.success(`Added client: ${name}`);
  };

  const handleDeleteClient = (accountId) => {
    setAllClients(prev => prev.filter(c => c.accountId !== accountId));
    setAllPlans(prev => prev.filter(p => p.accountId !== accountId));
    message.success('Client deleted');
  };

  const clientColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        if (editingClientId === record.accountId) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                size="small"
                value={editingClientName}
                onChange={(e) => setEditingClientName(e.target.value)}
                onPressEnter={() => {
                  const trimmed = editingClientName.trim();
                  if (trimmed) {
                    setAllClients(prev => prev.map(c => c.accountId === record.accountId ? { ...c, name: trimmed } : c));
                    message.success('Client renamed');
                  }
                  setEditingClientId(null);
                }}
                onKeyDown={(e) => { if (e.key === 'Escape') setEditingClientId(null); }}
                autoFocus
                style={{ flex: 1 }}
              />
              <Button type="text" size="small" icon={<CheckOutlined style={{ color: '#52c41a', fontSize: 13 }} />}
                onClick={() => {
                  const trimmed = editingClientName.trim();
                  if (trimmed) {
                    setAllClients(prev => prev.map(c => c.accountId === record.accountId ? { ...c, name: trimmed } : c));
                    message.success('Client renamed');
                  }
                  setEditingClientId(null);
                }}
              />
              <Button type="text" size="small" icon={<CloseOutlined style={{ color: '#ff4d4f', fontSize: 13 }} />}
                onClick={() => setEditingClientId(null)}
              />
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ flex: 1 }}>{text}</span>
            <EditOutlined
              style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => { setEditingClientId(record.accountId); setEditingClientName(text); }}
            />
          </div>
        );
      },
    },
    {
      title: 'Plans',
      key: 'plans',
      width: 60,
      align: 'center',
      render: (_, record) => allPlans.filter(p => p.accountId === record.accountId).length,
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete client and all its plans?"
          onConfirm={() => handleDeleteClient(record.accountId)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // --- Plans ---
  const [planClientId, setPlanClientId] = useState(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanType, setNewPlanType] = useState('DC');
  const [newPlanVendor, setNewPlanVendor] = useState('Vanguard');
  const [newPlanTier, setNewPlanTier] = useState(1);
  const [newPlanDefaultConfig, setNewPlanDefaultConfig] = useState(null);

  // Shared report configs available as defaults for plans
  const sharedConfigOptions = useMemo(() =>
    allConfigs
      .filter(c => c.AccountID === null || c.AccountID === undefined)
      .map(c => ({ value: c.ReportConfigID, label: c.ReportConfigName })),
    [allConfigs]
  );

  const filteredPlans = useMemo(() =>
    planClientId ? allPlans.filter(p => p.accountId === planClientId) : allPlans,
    [allPlans, planClientId]
  );

  const handleAddPlan = () => {
    const name = newPlanName.trim();
    if (!name || !planClientId) return;
    const nextId = Math.max(0, ...allPlans.map(p => p.ct_PlanID)) + 1;
    const newPlan = {
      id: nextId,
      ct_PlanID: nextId,
      accountId: planClientId,
      name,
      type: newPlanType,
      vendor: newPlanVendor,
      defaultTier: newPlanTier,
      defaultConfigId: newPlanDefaultConfig,
    };
    setAllPlans(prev => [...prev, newPlan]);
    setNewPlanName('');
    setNewPlanDefaultConfig(null);
    message.success(`Added plan: ${name}`);
  };

  const handleDeletePlan = (ct_PlanID) => {
    setAllPlans(prev => prev.filter(p => p.ct_PlanID !== ct_PlanID));
    setInvestments(prev => prev.filter(inv => inv.ct_PlanID !== ct_PlanID));
    message.success('Plan deleted');
  };

  const planColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text, record) => {
        if (editingPlanId === record.ct_PlanID) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                size="small"
                value={editingPlanName}
                onChange={(e) => setEditingPlanName(e.target.value)}
                onPressEnter={() => {
                  const trimmed = editingPlanName.trim();
                  if (trimmed) {
                    setAllPlans(prev => prev.map(p => p.ct_PlanID === record.ct_PlanID ? { ...p, name: trimmed } : p));
                    message.success('Plan renamed');
                  }
                  setEditingPlanId(null);
                }}
                onKeyDown={(e) => { if (e.key === 'Escape') setEditingPlanId(null); }}
                autoFocus
                style={{ flex: 1 }}
              />
              <Button type="text" size="small" icon={<CheckOutlined style={{ color: '#52c41a', fontSize: 13 }} />}
                onClick={() => {
                  const trimmed = editingPlanName.trim();
                  if (trimmed) {
                    setAllPlans(prev => prev.map(p => p.ct_PlanID === record.ct_PlanID ? { ...p, name: trimmed } : p));
                    message.success('Plan renamed');
                  }
                  setEditingPlanId(null);
                }}
              />
              <Button type="text" size="small" icon={<CloseOutlined style={{ color: '#ff4d4f', fontSize: 13 }} />}
                onClick={() => setEditingPlanId(null)}
              />
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ flex: 1 }}>{text}</span>
            <EditOutlined
              style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => { setEditingPlanId(record.ct_PlanID); setEditingPlanName(text); }}
            />
          </div>
        );
      },
    },
    {
      title: 'Client',
      key: 'client',
      width: 130,
      ellipsis: true,
      render: (_, record) => {
        const client = allClients.find(c => c.accountId === record.accountId);
        return <span style={{ fontSize: 11 }}>{client?.name || '—'}</span>;
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 50,
      render: (t) => <Tag style={{ fontSize: 10 }}>{t}</Tag>,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 90,
      render: (v) => <span style={{ fontSize: 11 }}>{v}</span>,
    },
    {
      title: 'Tier',
      dataIndex: 'defaultTier',
      key: 'tier',
      width: 80,
      render: (tier, record) => (
        <Select
          value={tier || 1}
          onChange={(val) => setAllPlans(prev => prev.map(p =>
            p.ct_PlanID === record.ct_PlanID ? { ...p, defaultTier: val } : p
          ))}
          size="small"
          style={{ width: 70 }}
          options={[
            { value: 1, label: 'Tier 1' },
            { value: 2, label: 'Tier 2' },
            { value: 3, label: 'Tier 3' },
            { value: 4, label: 'Tier 4' },
          ]}
        />
      ),
    },
    {
      title: 'Default Config',
      dataIndex: 'defaultConfigId',
      key: 'defaultConfig',
      width: 180,
      ellipsis: true,
      render: (configId, record) => (
        <Select
          value={configId || undefined}
          onChange={(val) => setAllPlans(prev => prev.map(p =>
            p.ct_PlanID === record.ct_PlanID ? { ...p, defaultConfigId: val } : p
          ))}
          size="small"
          style={{ width: 170 }}
          placeholder="None"
          allowClear
          showSearch
          filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
          options={sharedConfigOptions}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete this plan?"
          onConfirm={() => handleDeletePlan(record.ct_PlanID)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // --- Investments ---
  const [invPlanId, setInvPlanId] = useState(null);
  const [newInvRef, setNewInvRef] = useState('');
  const [newInvAssetClass, setNewInvAssetClass] = useState(assetClasses[0]);
  const [newInvGroup, setNewInvGroup] = useState(groupNames[0]);

  const filteredInvestments = useMemo(() =>
    invPlanId ? investments.filter(inv => inv.ct_PlanID === invPlanId) : investments,
    [investments, invPlanId]
  );

  const handleAddInvestment = () => {
    const ref = newInvRef.trim();
    if (!ref || !invPlanId) return;
    const nextInvId = Math.max(0, ...investments.map(inv => inv.ct_investmentid)) + 1;
    const currentOrder = investments.filter(inv => inv.ct_PlanID === invPlanId).length;
    const newInv = {
      ct_investmentid: nextInvId,
      ct_PlanID: invPlanId,
      Ref: ref,
      AssetClass: newInvAssetClass,
      GroupName: newInvGroup,
      Order: currentOrder + 1,
    };
    setInvestments(prev => [...prev, newInv]);
    setNewInvRef('');
    message.success(`Added investment: ${ref}`);
  };

  const handleDeleteInvestment = (ct_investmentid) => {
    setInvestments(prev => prev.filter(inv => inv.ct_investmentid !== ct_investmentid));
    setCandidates(prev => prev.filter(c => c.ct_investmentid !== ct_investmentid));
    message.success('Investment deleted');
  };

  const investmentColumns = [
    {
      title: 'Fund Name',
      dataIndex: 'Ref',
      key: 'ref',
      ellipsis: true,
    },
    {
      title: 'Plan',
      key: 'plan',
      width: 260,
      ellipsis: true,
      render: (_, record) => {
        const plan = allPlans.find(p => p.ct_PlanID === record.ct_PlanID);
        return <span style={{ fontSize: 11, color: '#8c8c8c' }}>{plan ? plan.name : `Plan ${record.ct_PlanID}`}</span>;
      },
    },
    {
      title: 'Q Complete',
      key: 'quarterComplete',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Checkbox
          checked={!!record.quarterComplete}
          onChange={(e) => {
            setInvestments(prev => prev.map(inv =>
              inv.ct_investmentid === record.ct_investmentid
                ? { ...inv, quarterComplete: e.target.checked }
                : inv
            ));
          }}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete this investment?"
          onConfirm={() => handleDeleteInvestment(record.ct_investmentid)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // --- Candidates ---
  const [candFilterPlanId, setCandFilterPlanId] = useState(null);
  const [newCandRef, setNewCandRef] = useState('');
  const [newCandReplacesRef, setNewCandReplacesRef] = useState(null);

  // Filter candidates by plan: show candidates whose replacesRef matches an investment in the selected plan
  const filteredCandidates = useMemo(() => {
    if (!candFilterPlanId) return candidates;
    const planInvNames = new Set(
      investments.filter(inv => inv.ct_PlanID === candFilterPlanId).map(inv => inv.Ref)
    );
    return candidates.filter(c => c.replacesRef && planInvNames.has(c.replacesRef));
  }, [candidates, candFilterPlanId, investments]);

  // All unique investment names (deduplicated) for the "Replaces" dropdown, grouped by plan
  const unifiedInvestmentOptions = useMemo(() => {
    // Build map: investmentName → list of plan names
    const invPlanMap = {};
    investments.forEach(inv => {
      if (!invPlanMap[inv.Ref]) invPlanMap[inv.Ref] = new Set();
      const plan = allPlans.find(p => p.ct_PlanID === inv.ct_PlanID);
      invPlanMap[inv.Ref].add(plan ? plan.name : `Plan ${inv.ct_PlanID}`);
    });
    return Object.entries(invPlanMap)
      .map(([ref, planNames]) => ({
        value: ref,
        label: `${ref}  (${[...planNames].join(', ')})`,
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [investments, allPlans]);

  const handleAddCandidate = () => {
    const ref = newCandRef.trim();
    if (!ref || !newCandReplacesRef) return;
    const nextId = Math.max(0, ...candidates.map(c => c.ct_investmentid)) + 1;
    const newCand = {
      ct_investmentid: nextId,
      Ref: ref,
      isCandidate: true,
      replacesRef: newCandReplacesRef,
    };
    setCandidates(prev => [...prev, newCand]);
    setNewCandRef('');
    setNewCandReplacesRef(null);
    message.success(`Added candidate: ${ref}`);
  };

  const handleDeleteCandidate = (ct_investmentid) => {
    setCandidates(prev => prev.filter(c => c.ct_investmentid !== ct_investmentid));
    message.success('Candidate deleted');
  };

  const candidateColumns = [
    {
      title: 'Candidate Fund',
      dataIndex: 'Ref',
      key: 'ref',
      ellipsis: true,
    },
    {
      title: 'Compared Against',
      key: 'replaces',
      width: 200,
      ellipsis: true,
      filters: [...new Set(candidates.filter(c => c.replacesRef).map(c => c.replacesRef))]
        .sort()
        .map(ref => ({ text: ref, value: ref })),
      onFilter: (value, record) => record.replacesRef === value,
      render: (_, record) => {
        if (!record.replacesRef) return <span style={{ fontSize: 11, color: '#8c8c8c' }}>—</span>;
        return <span style={{ fontSize: 11 }}>{record.replacesRef}</span>;
      },
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete this candidate?"
          onConfirm={() => handleDeleteCandidate(record.ct_investmentid)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // Plan options for dropdowns (with client name)
  const planOptionsWithClient = useMemo(() =>
    allPlans.map(p => {
      const client = allClients.find(c => c.accountId === p.accountId);
      return {
        value: p.ct_PlanID,
        label: `${p.name} (${p.type}) — ${client?.name || 'Unknown'}`,
      };
    }),
    [allPlans, allClients]
  );

  // --- Fund Changes ---
  const [fcPlanId, setFcPlanId] = useState(null);
  const [newFcType, setNewFcType] = useState('inProgress');
  const [newFcCurrentFund, setNewFcCurrentFund] = useState('');
  const [newFcReplacementFund, setNewFcReplacementFund] = useState('');
  const [newFcPercentage, setNewFcPercentage] = useState(100);
  const [newFcEffectiveDate, setNewFcEffectiveDate] = useState('');

  const filteredFundChanges = useMemo(() =>
    fcPlanId ? allFundChanges.filter(fc => fc.ct_PlanID === fcPlanId) : allFundChanges,
    [allFundChanges, fcPlanId]
  );
  const fcInProgress = useMemo(() => filteredFundChanges.filter(fc => fc.changeType === 'inProgress'), [filteredFundChanges]);
  const fcExecuted = useMemo(() => filteredFundChanges.filter(fc => fc.changeType === 'executed'), [filteredFundChanges]);

  const handleAddFundChange = () => {
    const currentFund = newFcCurrentFund.trim();
    const replacementFund = newFcReplacementFund.trim();
    if (!currentFund || !replacementFund || !fcPlanId) return;
    const nextId = Math.max(0, ...allFundChanges.map(fc => fc.id)) + 1;
    const newFc = {
      id: nextId,
      ct_PlanID: fcPlanId,
      changeType: newFcType,
      currentFund,
      percentage: newFcPercentage,
      replacementFund,
      effectiveDate: newFcEffectiveDate || null,
      included: true,
    };
    setAllFundChanges(prev => [...prev, newFc]);
    setNewFcCurrentFund('');
    setNewFcReplacementFund('');
    setNewFcPercentage(100);
    setNewFcEffectiveDate('');
    message.success(`Added ${newFcType === 'inProgress' ? 'in-progress' : 'executed'} fund change`);
  };

  const handleDeleteFundChange = (id) => {
    setAllFundChanges(prev => prev.filter(fc => fc.id !== id));
    message.success('Fund change deleted');
  };

  const fcColumns = [
    {
      title: 'Current Investment',
      dataIndex: 'currentFund',
      key: 'currentFund',
      ellipsis: true,
    },
    {
      title: '%',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 50,
      render: (v) => `${v}%`,
    },
    {
      title: 'Replacement Investment',
      dataIndex: 'replacementFund',
      key: 'replacementFund',
      ellipsis: true,
    },
    {
      title: 'Effective',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 110,
      render: (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : <Tag color="default">Pending</Tag>,
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete this fund change?"
          onConfirm={() => handleDeleteFundChange(record.id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const clientOptions = useMemo(() =>
    allClients.map(c => ({ value: c.accountId, label: c.name })),
    [allClients]
  );

  const tabItems = [
    {
      key: 'clients',
      label: `Clients (${allClients.length})`,
      children: (
        <div>
          <Space style={{ marginBottom: 12, width: '100%' }}>
            <Input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="New client name..."
              style={{ width: 280 }}
              onPressEnter={handleAddClient}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClient} disabled={!newClientName.trim()}>
              Add Client
            </Button>
          </Space>
          <Table
            dataSource={allClients}
            columns={clientColumns}
            rowKey="accountId"
            size="small"
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: 'plans',
      label: `Plans (${allPlans.length})`,
      children: (
        <div>
          <div style={{ marginBottom: 12 }}>
            <Space style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Client:</span>
              <Select
                value={planClientId}
                onChange={setPlanClientId}
                options={clientOptions}
                placeholder="Select client..."
                style={{ width: 220 }}
                allowClear
              />
            </Space>
          </div>
          {planClientId && (
            <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
              <Input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Plan name..."
                style={{ width: 220 }}
                onPressEnter={handleAddPlan}
              />
              <Select value={newPlanType} onChange={setNewPlanType} style={{ width: 80 }}
                options={planTypes.map(t => ({ value: t, label: t }))}
              />
              <Select value={newPlanVendor} onChange={setNewPlanVendor} style={{ width: 140 }}
                options={vendors.map(v => ({ value: v, label: v }))}
              />
              <Select value={newPlanTier} onChange={setNewPlanTier} style={{ width: 80 }}
                options={[
                  { value: 1, label: 'Tier 1' },
                  { value: 2, label: 'Tier 2' },
                  { value: 3, label: 'Tier 3' },
                  { value: 4, label: 'Tier 4' },
                ]}
              />
              <Select
                value={newPlanDefaultConfig}
                onChange={setNewPlanDefaultConfig}
                style={{ width: 200 }}
                placeholder="Default config..."
                allowClear
                showSearch
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                options={sharedConfigOptions}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlan} disabled={!newPlanName.trim()}>
                Add Plan
              </Button>
            </Space>
          )}
          <Table
            dataSource={filteredPlans}
            columns={planColumns}
            rowKey="ct_PlanID"
            size="small"
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: 'investments',
      label: `Investments (${investments.length})`,
      children: (
        <div>
          <div style={{ marginBottom: 12 }}>
            <Space>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Plan:</span>
              <Select
                value={invPlanId}
                onChange={setInvPlanId}
                options={planOptionsWithClient}
                placeholder="Select plan..."
                style={{ width: 380 }}
                showSearch
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                allowClear
              />
            </Space>
          </div>
          {invPlanId && (
            <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
              <Input
                value={newInvRef}
                onChange={(e) => setNewInvRef(e.target.value)}
                placeholder="Fund name..."
                style={{ width: 260 }}
                onPressEnter={handleAddInvestment}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInvestment} disabled={!newInvRef.trim()}>
                Add
              </Button>
            </Space>
          )}
          <Table
            dataSource={filteredInvestments}
            columns={investmentColumns}
            rowKey="ct_investmentid"
            size="small"
            pagination={filteredInvestments.length > 15 ? { pageSize: 15 } : false}
          />
        </div>
      ),
    },
    {
      key: 'candidates',
      label: `Candidates (${candidates.length})`,
      children: (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <Input
                value={newCandRef}
                onChange={(e) => setNewCandRef(e.target.value)}
                placeholder="Candidate fund name..."
                style={{ width: 200 }}
                onPressEnter={handleAddCandidate}
              />
              <Select
                value={newCandReplacesRef}
                onChange={setNewCandReplacesRef}
                placeholder="Compared against..."
                style={{ width: 480 }}
                popupMatchSelectWidth={false}
                dropdownStyle={{ width: 520 }}
                showSearch
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                options={unifiedInvestmentOptions}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCandidate} disabled={!newCandRef.trim() || !newCandReplacesRef}>
                Add
              </Button>
            </div>
            <Space>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Filter by plan:</span>
              <Select
                value={candFilterPlanId}
                onChange={setCandFilterPlanId}
                options={planOptionsWithClient}
                placeholder="All plans"
                style={{ width: 380 }}
                showSearch
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                allowClear
              />
            </Space>
          </div>
          <Table
            dataSource={filteredCandidates}
            columns={candidateColumns}
            rowKey="ct_investmentid"
            size="small"
            pagination={filteredCandidates.length > 15 ? { pageSize: 15 } : false}
          />
        </div>
      ),
    },
    {
      key: 'fundChanges',
      label: `Fund Changes (${allFundChanges.length})`,
      children: (
        <div>
          <div style={{ marginBottom: 12 }}>
            <Space>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Plan:</span>
              <Select
                value={fcPlanId}
                onChange={setFcPlanId}
                options={planOptionsWithClient}
                placeholder="Select plan..."
                style={{ width: 380 }}
                showSearch
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                allowClear
              />
            </Space>
          </div>
          {fcPlanId && (
            <Space style={{ marginBottom: 12, flexWrap: 'wrap' }} wrap>
              <Select value={newFcType} onChange={setNewFcType} style={{ width: 140 }}
                options={[
                  { value: 'inProgress', label: 'In Progress' },
                  { value: 'executed', label: 'Since Last Qtr' },
                ]}
              />
              <Input
                value={newFcCurrentFund}
                onChange={(e) => setNewFcCurrentFund(e.target.value)}
                placeholder="Current investment..."
                style={{ width: 200 }}
              />
              <Input
                value={newFcReplacementFund}
                onChange={(e) => setNewFcReplacementFund(e.target.value)}
                placeholder="Replacement investment..."
                style={{ width: 200 }}
              />
              <Input
                value={newFcPercentage}
                onChange={(e) => setNewFcPercentage(Number(e.target.value) || 100)}
                placeholder="%"
                style={{ width: 60 }}
                suffix="%"
              />
              <Input
                value={newFcEffectiveDate}
                onChange={(e) => setNewFcEffectiveDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                style={{ width: 130 }}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFundChange} disabled={!newFcCurrentFund.trim() || !newFcReplacementFund.trim()}>
                Add
              </Button>
            </Space>
          )}
          {fcInProgress.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#00437B' }}>
                Fund changes in progress ({fcInProgress.length})
              </div>
              <Table
                dataSource={fcInProgress}
                columns={fcColumns}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </div>
          )}
          {fcExecuted.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#52c41a' }}>
                Fund changes executed in the past year ({fcExecuted.length})
              </div>
              <Table
                dataSource={fcExecuted}
                columns={fcColumns}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </div>
          )}
          {filteredFundChanges.length === 0 && fcPlanId && (
            <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
              No fund changes for this plan yet. Add one above.
            </div>
          )}
          {!fcPlanId && allFundChanges.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
              No fund changes created yet. Select a plan and add fund changes.
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'pagesets',
      label: (
        <span><UnorderedListOutlined style={{ marginRight: 4 }} />Pagesets ({seedPagesets.length})</span>
      ),
      children: (() => {
        const grouped = pagesetCategories.map(cat => ({
          ...cat,
          items: seedPagesets.filter(p => p.categoryId === cat.id),
        }));
        return (
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            {grouped.map(cat => (
              <div key={cat.id} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#00437B', marginBottom: 6, borderBottom: '1px solid #d9d9d9', paddingBottom: 4 }}>
                  {cat.name}
                  <Tag style={{ marginLeft: 8, fontSize: 10 }}>{cat.items.length}</Tag>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {cat.items.map(page => {
                    const hasImage = !!exhibitImages[page.id];
                    const headers = exhibitHeaders[page.id] || ['Default'];
                    const hasCustomHeaders = headers.length > 1 || (headers.length === 1 && headers[0] !== 'Default');
                    return (
                      <Popover
                        key={page.id}
                        trigger="click"
                        content={
                          <div style={{ width: 340 }}>
                            {/* Screenshot section */}
                            {hasImage ? (
                              <div>
                                <img src={exhibitImages[page.id]} alt={page.name} style={{ width: '100%', borderRadius: 4, marginBottom: 8 }} />
                                <Button
                                  size="small"
                                  danger
                                  onClick={() => {
                                    if (setExhibitImages) {
                                      setExhibitImages(prev => {
                                        const next = { ...prev };
                                        delete next[page.id];
                                        return next;
                                      });
                                    }
                                  }}
                                  style={{ width: '100%' }}
                                >
                                  Remove Image
                                </Button>
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>No screenshot uploaded</div>
                              </div>
                            )}
                            <Button
                              size="small"
                              icon={<UploadOutlined />}
                              style={{ width: '100%', marginTop: hasImage ? 4 : 0 }}
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.png,.jpg,.jpeg,.gif,.webp';
                                input.onchange = async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  try {
                                    // Compress to max 1200px JPEG 0.8 — massively shrinks storage footprint
                                    const dataUrl = await compressImage(file, 1200, 0.8);
                                    if (setExhibitImages) {
                                      setExhibitImages(prev => ({ ...prev, [page.id]: dataUrl }));
                                      const sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
                                      message.success(`Screenshot uploaded for "${page.name}" (${sizeKb} KB)`);
                                    }
                                  } catch (err) {
                                    console.error('Failed to compress image:', err);
                                    message.error('Failed to process image');
                                  }
                                };
                                input.click();
                              }}
                            >
                              {hasImage ? 'Replace Image' : 'Upload Screenshot'}
                            </Button>

                            {/* Header text options */}
                            <Divider style={{ margin: '10px 0 8px' }} />
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#00437B', marginBottom: 6 }}>Header Text Options</div>
                            {headers.map((h, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                <Input
                                  size="small"
                                  value={h}
                                  style={{ flex: 1, fontSize: 12 }}
                                  onChange={(e) => {
                                    if (setExhibitHeaders) {
                                      const updated = [...headers];
                                      updated[idx] = e.target.value;
                                      setExhibitHeaders(prev => ({ ...prev, [page.id]: updated }));
                                    }
                                  }}
                                />
                                {headers.length > 1 && (
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                                    onClick={() => {
                                      if (setExhibitHeaders) {
                                        const updated = headers.filter((_, i) => i !== idx);
                                        setExhibitHeaders(prev => ({ ...prev, [page.id]: updated }));
                                      }
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                            <Button
                              size="small"
                              type="dashed"
                              icon={<PlusOutlined />}
                              style={{ width: '100%', marginTop: 4, fontSize: 11 }}
                              onClick={() => {
                                if (setExhibitHeaders) {
                                  setExhibitHeaders(prev => ({
                                    ...prev,
                                    [page.id]: [...(prev[page.id] || ['Default']), ''],
                                  }));
                                }
                              }}
                            >
                              Add Header Option
                            </Button>
                          </div>
                        }
                        title={page.name}
                      >
                        <Tag
                          color={page.isTab ? 'blue' : undefined}
                          style={{ fontSize: 11, margin: 0, cursor: 'pointer', border: hasImage ? '2px solid #52c41a' : hasCustomHeaders ? '2px solid #3465CD' : undefined }}
                        >
                          {hasImage && <PictureOutlined style={{ marginRight: 3, color: '#52c41a' }} />}
                          {hasCustomHeaders && !hasImage && <EditOutlined style={{ marginRight: 3, color: '#3465CD', fontSize: 10 }} />}
                          {page.isTab ? 'TAB ' : ''}{page.name.replace(/^TAB - /, '')}
                          {headers.length > 1 && <span style={{ marginLeft: 3, fontSize: 9, color: '#3465CD' }}>({headers.length})</span>}
                        </Tag>
                      </Popover>
                    );
                  })}
                  {cat.items.length === 0 && (
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>No pagesets in this category</span>
                  )}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #d9d9d9' }}>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                Pagesets are defined in the seed data. In production, these would be managed via a database admin tool.
                Contact the development team to add new pagesets or modify categories.
              </div>
            </div>
          </div>
        );
      })(),
    },
    {
      key: 'changelog',
      label: (
        <span><HistoryOutlined style={{ marginRight: 4 }} />Changelog</span>
      ),
      children: (
        <div style={{ maxHeight: 500, overflow: 'auto', fontSize: 13, lineHeight: 1.7 }}>
          {changelogRaw.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: '#00437B', marginTop: 0 }}>{line.slice(2)}</h2>;
            if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: '#00437B', marginTop: 16, borderBottom: '1px solid #d9d9d9', paddingBottom: 4 }}>{line.slice(3)}</h3>;
            if (line.startsWith('### ')) return <h4 key={i} style={{ fontSize: 14, fontWeight: 600, color: '#3465CD', marginTop: 12 }}>{line.slice(4)}</h4>;
            if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 700, marginTop: 10, color: '#3F3F3F' }}>{line.slice(2, -2)}</div>;
            if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 16, position: 'relative' }}><span style={{ position: 'absolute', left: 4 }}>&bull;</span>{line.slice(2)}</div>;
            if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid #d9d9d9', margin: '12px 0' }} />;
            if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
            return <div key={i}>{line}</div>;
          })}
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <ExperimentOutlined style={{ color: '#5B325F' }} />
          <span>Demo Data Configuration</span>
          <Tag color="purple" style={{ fontSize: 10 }}>Mockup Only</Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={880}
      styles={{ body: { paddingTop: 8 } }}
    >
      <div style={{
        background: '#f9f0ff',
        border: '1px solid #d3adf7',
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 12,
        fontSize: 12,
        color: '#5B325F',
      }}>
        This panel lets you add mock clients, plans, investments, and candidate managers for demo purposes.
        Changes persist in your browser. This would not exist in the production application.
      </div>

      {/* User Permission Toggle */}
      <div style={{
        background: isTemplateAdmin ? '#edf6fb' : '#fafafa',
        border: `1px solid ${isTemplateAdmin ? '#5FB4E5' : '#d9d9d9'}`,
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Space>
          {isTemplateAdmin
            ? <UnlockOutlined style={{ color: '#00437B' }} />
            : <LockOutlined style={{ color: '#8c8c8c' }} />
          }
          <span style={{ fontSize: 13 }}>
            <strong>Shared Template Admin</strong>
            <span style={{ color: '#8c8c8c', marginLeft: 8, fontSize: 12 }}>
              {isTemplateAdmin
                ? 'You can create, modify, and delete shared CAPTRUST report configs & exhibit templates'
                : 'You can only use shared templates — save as client-specific to customize'
              }
            </span>
          </span>
        </Space>
        <Switch
          checked={isTemplateAdmin}
          onChange={(checked) => setIsTemplateAdmin && setIsTemplateAdmin(checked)}
          checkedChildren="On"
          unCheckedChildren="Off"
          size="small"
        />
      </div>

      <Space style={{ marginBottom: 12 }}>
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => {
            const data = {
              clients: allClients,
              plans: allPlans,
              investments,
              candidates,
              configs: allConfigs,
              templates: allTemplates,
              planGroups: allPlanGroups,
              fundChanges: allFundChanges,
              exhibitImages,
              exhibitHeaders,
              _exportedAt: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `irp-demo-data-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            message.success('Demo data exported');
          }}
        >
          Export Data
        </Button>
        <Button
          size="small"
          icon={<UploadOutlined />}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => {
                try {
                  const data = JSON.parse(evt.target.result);
                  if (data.clients) setAllClients(data.clients);
                  if (data.plans) setAllPlans(data.plans);
                  if (data.investments) setInvestments(data.investments);
                  if (data.candidates) setCandidates(data.candidates);
                  if (data.configs && setAllConfigs) setAllConfigs(data.configs);
                  if (data.templates && setAllTemplates) setAllTemplates(data.templates);
                  if (data.planGroups && setAllPlanGroups) setAllPlanGroups(data.planGroups);
                  if (data.fundChanges && setAllFundChanges) setAllFundChanges(data.fundChanges);
                  if (data.exhibitImages && setExhibitImages) setExhibitImages(data.exhibitImages);
                  if (data.exhibitHeaders && setExhibitHeaders) setExhibitHeaders(data.exhibitHeaders);
                  message.success('Demo data imported successfully');
                } catch (err) {
                  message.error('Failed to import: invalid JSON file');
                }
              };
              reader.readAsText(file);
            };
            input.click();
          }}
        >
          Import Data
        </Button>
      </Space>

      <Tabs items={tabItems} size="small" />
    </Drawer>
  );
}
