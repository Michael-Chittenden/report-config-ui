import { useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Space, Button, Tooltip, Badge } from 'antd';
import {
  DashboardOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  CopyOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { bulkTierOverrides, bulkPctThresholds, reportConfigTypes } from '../data/mockData';

export default function BulkDashboard({ allConfigs = [], allClients = [], allPlans = [], investments = [], onClose }) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState(null);

  // All configs with BulkRun enabled
  const bulkConfigs = useMemo(() => {
    return allConfigs
      .filter(c => c.BulkRun && c.AccountID != null)
      .map(c => {
        const client = c.AccountID
          ? allClients.find(cl => cl.accountId === c.AccountID)
          : null;
        const clientName = client ? client.name : (c.AccountID === null || c.AccountID === undefined) ? 'CAPTRUST Shared' : 'Unknown';

        // Resolve plan names
        let planNames = [];
        let planIds = [];
        if (c.ct_PlanID) {
          planIds = [c.ct_PlanID];
          const plan = allPlans.find(p => p.ct_PlanID === c.ct_PlanID);
          planNames = plan ? [plan.name] : [`Plan ${c.ct_PlanID}`];
        } else if (c._planIds && c._planIds.length > 0) {
          planIds = c._planIds;
          planNames = c._planIds.map(id => {
            const plan = allPlans.find(p => p.ct_PlanID === id);
            return plan ? plan.name : `Plan ${id}`;
          });
        }

        // Count investments for these plans
        const planInvestments = planIds.length > 0
          ? investments.filter(inv => planIds.includes(inv.ct_PlanID))
          : [];
        const investmentCount = planInvestments.length;
        const completedCount = planInvestments.filter(inv => inv.quarterComplete).length;

        // Tier and threshold lookups
        const tierName = c.BulkTierOverrideID
          ? bulkTierOverrides.find(t => t.id === c.BulkTierOverrideID)?.name || `Tier ${c.BulkTierOverrideID}`
          : 'Default';
        const thresholdName = c.BulkPctThresholdID
          ? bulkPctThresholds.find(t => t.id === c.BulkPctThresholdID)?.name || `${c.BulkPctThresholdID}`
          : 'Default';

        return {
          key: c.ReportConfigID,
          ...c,
          clientName,
          planNames,
          planIds,
          investmentCount,
          completedCount,
          tierName,
          thresholdName,
        };
      })
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [allConfigs, allClients, allPlans, investments]);

  // Apply filters
  const filteredConfigs = useMemo(() => {
    return bulkConfigs.filter(c => {
      if (clientFilter && c.AccountID !== clientFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !c.ReportConfigName.toLowerCase().includes(s) &&
          !c.clientName.toLowerCase().includes(s) &&
          !c.planNames.some(n => n.toLowerCase().includes(s))
        ) return false;
      }
      return true;
    });
  }, [bulkConfigs, clientFilter, search]);

  // Unique clients for the filter dropdown
  const clientOptions = useMemo(() => {
    const seen = new Set();
    return bulkConfigs
      .filter(c => {
        if (!c.AccountID || seen.has(c.AccountID)) return false;
        seen.add(c.AccountID);
        return true;
      })
      .map(c => ({ value: c.AccountID, label: c.clientName }));
  }, [bulkConfigs]);

  // Summary stats
  const totalConfigs = filteredConfigs.length;
  const totalPlans = new Set(filteredConfigs.flatMap(c => c.planIds)).size;
  const totalInvestments = filteredConfigs.reduce((sum, c) => sum + c.investmentCount, 0);
  const clientCount = new Set(filteredConfigs.map(c => c.AccountID).filter(Boolean)).size;

  const configTypeIcon = (type) => {
    switch (type) {
      case 1: return <FileTextOutlined />;
      case 2: return <CopyOutlined />;
      case 3: return <AppstoreOutlined />;
      default: return <TeamOutlined />;
    }
  };

  const configTypeColor = (type) => {
    switch (type) {
      case 1: return '#00437B';
      case 2: return '#3465CD';
      case 3: return '#5B325F';
      default: return '#7CA7AE';
    }
  };

  const columns = [
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'client',
      width: 160,
      sorter: (a, b) => a.clientName.localeCompare(b.clientName),
      render: (name) => (
        <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
      ),
    },
    {
      title: 'Report Configuration',
      dataIndex: 'ReportConfigName',
      key: 'name',
      sorter: (a, b) => a.ReportConfigName.localeCompare(b.ReportConfigName),
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>
            {record._savedBy || 'Unknown'} &bull; {new Date(record.LastSaved).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'ReportConfigType',
      key: 'type',
      width: 120,
      filters: [
        { text: 'Single Plan', value: 1 },
        { text: 'Multi Plan', value: 2 },
        { text: 'Combo', value: 3 },
        { text: 'Client Only', value: 4 },
      ],
      onFilter: (value, record) => record.ReportConfigType === value,
      render: (type) => (
        <Tag color={configTypeColor(type)} style={{ fontSize: 11 }}>
          {configTypeIcon(type)} {reportConfigTypes[type] || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'Plans',
      dataIndex: 'planNames',
      key: 'plans',
      width: 200,
      render: (names) => {
        if (!names || names.length === 0) return <span style={{ color: '#8c8c8c', fontSize: 12 }}>Shared — all eligible</span>;
        if (names.length <= 2) {
          return names.map((n, i) => <Tag key={i} style={{ fontSize: 11, margin: '1px 2px' }}>{n}</Tag>);
        }
        return (
          <Tooltip title={names.join(', ')}>
            <span>
              <Tag style={{ fontSize: 11 }}>{names[0]}</Tag>
              <Tag style={{ fontSize: 11, color: '#8c8c8c' }}>+{names.length - 1} more</Tag>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Tier',
      dataIndex: 'tierName',
      key: 'tier',
      width: 120,
      sorter: (a, b) => a.tierName.localeCompare(b.tierName),
      render: (name) => (
        <Tag color={name === 'Default' ? 'default' : 'blue'} style={{ fontSize: 11 }}>
          <ClockCircleOutlined style={{ marginRight: 3 }} />
          {name}
        </Tag>
      ),
    },
    {
      title: 'Investments',
      dataIndex: 'investmentCount',
      key: 'investments',
      width: 100,
      sorter: (a, b) => a.investmentCount - b.investmentCount,
      render: (count) => (
        <span style={{ fontSize: 13, fontWeight: 600 }}>{count}</span>
      ),
    },
    {
      title: 'Completed',
      key: 'completed',
      width: 110,
      sorter: (a, b) => a.completedCount - b.completedCount,
      render: (_, record) => {
        const pct = record.investmentCount > 0 ? Math.round((record.completedCount / record.investmentCount) * 100) : 0;
        const color = pct === 100 ? '#52c41a' : pct > 0 ? '#fa8c16' : '#d9d9d9';
        return (
          <span style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 600, color }}>{record.completedCount}</span>
            <span style={{ color: '#8c8c8c' }}> / {record.investmentCount}</span>
            <span style={{ fontSize: 10, color: '#8c8c8c', marginLeft: 4 }}>({pct}%)</span>
          </span>
        );
      },
    },
    {
      title: (
        <Tooltip title="Data completion tracking — coming soon">
          <span style={{ color: '#bfbfbf' }}>Data Ready</span>
        </Tooltip>
      ),
      key: 'dataReady',
      width: 100,
      render: () => (
        <span style={{ color: '#d9d9d9', fontSize: 12 }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} />
          —
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 100,
      render: () => (
        <Tooltip title="Manual report triggering — coming soon">
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            disabled
            style={{ fontSize: 11 }}
          >
            Run
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onClose}
            style={{ color: '#00437B' }}
          >
            Back to Configuration
          </Button>
          <div style={{ borderLeft: '1px solid #d9d9d9', height: 24 }} />
          <DashboardOutlined style={{ fontSize: 20, color: '#00437B' }} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Bulk Run Dashboard</h2>
        </div>
      </div>


      {/* Filters */}
      <div style={{
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        padding: '12px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <SearchOutlined style={{ color: '#8c8c8c' }} />
        <Input
          placeholder="Search configs, clients, plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
          size="small"
          allowClear
        />
        <Select
          placeholder="All Clients"
          value={clientFilter}
          onChange={setClientFilter}
          allowClear
          style={{ width: 200 }}
          size="small"
          options={clientOptions}
        />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8c8c8c' }}>
          Showing {filteredConfigs.length} of {bulkConfigs.length} bulk-scheduled configurations
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
        <Table
          dataSource={filteredConfigs}
          columns={columns}
          size="small"
          pagination={filteredConfigs.length > 25 ? { pageSize: 25, showSizeChanger: true } : false}
          rowKey="key"
          locale={{ emptyText: 'No bulk-scheduled report configurations found' }}
        />
      </div>
    </div>
  );
}
