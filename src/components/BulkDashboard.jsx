import { useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Space, Button, Tooltip, Badge, Modal } from 'antd';
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
  EyeOutlined,
  SwapOutlined,
  ExperimentOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { bulkTierOverrides, bulkPctThresholds, reportConfigTypes, pagesets } from '../data/mockData';
import { resolveExhibitPageSetIds } from '../data/dataResolvers';

export default function BulkDashboard({ allConfigs = [], allClients = [], allPlans = [], investments = [], allTemplates = [], allFundChanges = [], onClose }) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState(null);
  const [reviewConfig, setReviewConfig] = useState(null);

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

        // Check if using a shared report config (via ParentReportConfigID or defaultConfigId linkage)
        // For this dashboard, a config is "shared-based" if it was originally a CAPTRUST shared config
        // We detect this by checking if there's a shared config with the same name pattern
        const isUsingSharedConfig = (() => {
          if (c.ParentReportConfigID) {
            const parent = allConfigs.find(pc => pc.ReportConfigID === c.ParentReportConfigID);
            return parent && (parent.AccountID === null || parent.AccountID === undefined);
          }
          // Check if a shared config exists with this name (minus client-specific suffixes)
          const sharedMatch = allConfigs.find(sc =>
            (sc.AccountID === null || sc.AccountID === undefined) &&
            sc.ReportConfigID !== c.ReportConfigID &&
            c.ReportConfigName.includes(sc.ReportConfigName)
          );
          return !!sharedMatch;
        })();

        // Resolve exhibit template and its pages
        const template = c.ExhibitTemplateID
          ? allTemplates.find(t => t.ExhibitTemplateID === c.ExhibitTemplateID)
          : null;
        const exhibitTemplateName = template ? template.Name : null;
        const isSharedTemplate = template && (template.AccountID === null || template.AccountID === undefined);
        const exhibitPageIds = c.ExhibitTemplateID ? resolveExhibitPageSetIds(c.ExhibitTemplateID) : [];
        const exhibitPages = exhibitPageIds.map(id => pagesets.find(p => p.id === id)).filter(Boolean);

        // Resolve fund changes for these plans
        const planFundChanges = planIds.length > 0
          ? allFundChanges.filter(fc => planIds.includes(fc.ct_PlanID))
          : [];

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
          isUsingSharedConfig,
          exhibitTemplateName,
          isSharedTemplate,
          exhibitPages,
          planFundChanges,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
            {record.isUsingSharedConfig && (
              <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>Shared</Tag>
            )}
          </div>
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
      title: 'Exhibit Template',
      key: 'exhibit',
      width: 180,
      render: (_, record) => {
        if (!record.exhibitTemplateName) return <span style={{ color: '#d9d9d9', fontSize: 12 }}>None</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12 }}>{record.exhibitTemplateName}</span>
            {record.isSharedTemplate && (
              <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>Shared</Tag>
            )}
          </div>
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
      title: 'Report Status',
      key: 'reportStatus',
      width: 110,
      filters: [
        { text: 'Completed', value: 'Completed' },
        { text: 'Pending', value: 'Pending' },
        { text: 'Delayed', value: 'Delayed' },
      ],
      onFilter: (value, record) => {
        const pct = record.investmentCount > 0 ? Math.round((record.completedCount / record.investmentCount) * 100) : 0;
        const status = pct === 100 ? 'Completed' : pct > 0 ? 'Delayed' : 'Pending';
        return status === value;
      },
      render: (_, record) => {
        const pct = record.investmentCount > 0 ? Math.round((record.completedCount / record.investmentCount) * 100) : 0;
        if (pct === 100) return <Tag color="success" style={{ fontSize: 11 }}><CheckCircleOutlined style={{ marginRight: 3 }} />Completed</Tag>;
        if (pct > 0) return <Tag color="warning" style={{ fontSize: 11 }}><ClockCircleOutlined style={{ marginRight: 3 }} />Delayed</Tag>;
        return <Tag style={{ fontSize: 11, color: '#8c8c8c' }}><ClockCircleOutlined style={{ marginRight: 3 }} />Pending</Tag>;
      },
    },
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setReviewConfig(record)}
          style={{ fontSize: 11 }}
        >
          Review
        </Button>
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

      {/* Review Modal */}
      <Modal
        title={reviewConfig ? `Review: ${reviewConfig.ReportConfigName}` : 'Review'}
        open={!!reviewConfig}
        onCancel={() => setReviewConfig(null)}
        footer={<Button onClick={() => setReviewConfig(null)}>Close</Button>}
        width={720}
      >
        {reviewConfig && (() => {
          const planInvs = reviewConfig.planIds.length > 0
            ? investments.filter(inv => reviewConfig.planIds.includes(inv.ct_PlanID))
            : [];
          const fcInProgress = reviewConfig.planFundChanges.filter(fc => fc.changeType === 'inProgress');
          const fcExecuted = reviewConfig.planFundChanges.filter(fc => fc.changeType === 'executed');
          const totalInv = planInvs.length;
          const completedInv = planInvs.filter(inv => inv.quarterComplete).length;
          const pct = totalInv > 0 ? Math.round((completedInv / totalInv) * 100) : 0;

          return (
            <div>
              {/* Client + Config info */}
              <div style={{ marginBottom: 12, fontSize: 13, color: '#595959' }}>
                <strong>{reviewConfig.clientName}</strong>
                {reviewConfig.isUsingSharedConfig && <Tag color="purple" style={{ fontSize: 10, marginLeft: 6 }}>Shared Config</Tag>}
                <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                Tier: <strong>{reviewConfig.tierName}</strong>
                <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                Last saved: {new Date(reviewConfig.LastSaved).toLocaleDateString()}
              </div>

              {/* Summary bar */}
              <div style={{ background: '#edf6fb', border: '1px solid #5FB4E5', borderRadius: 6, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <span><TeamOutlined style={{ color: '#00437B', marginRight: 6 }} /><strong>{reviewConfig.planNames.length}</strong> plan{reviewConfig.planNames.length !== 1 ? 's' : ''}</span>
                <span><FileTextOutlined style={{ color: '#3465CD', marginRight: 6 }} /><strong>{totalInv}</strong> investment{totalInv !== 1 ? 's' : ''}</span>
                <span style={{ color: pct === 100 ? '#52c41a' : pct > 0 ? '#fa8c16' : '#8c8c8c' }}>
                  <CheckCircleOutlined style={{ marginRight: 6 }} /><strong>{completedInv}/{totalInv}</strong> complete ({pct}%)
                </span>
                {(fcInProgress.length > 0 || fcExecuted.length > 0) && (
                  <span><SwapOutlined style={{ color: '#fa8c16', marginRight: 6 }} /><strong>{fcInProgress.length + fcExecuted.length}</strong> fund change{fcInProgress.length + fcExecuted.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Per-plan breakdown */}
              {reviewConfig.planNames.map((planName, idx) => {
                const planId = reviewConfig.planIds[idx];
                const planInvestments = investments.filter(inv => inv.ct_PlanID === planId);
                const plan = allPlans.find(p => p.ct_PlanID === planId);
                const planFc = reviewConfig.planFundChanges.filter(fc => fc.ct_PlanID === planId);

                return (
                  <div key={planId || idx} style={{ marginBottom: 12, border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ background: '#edf6fb', padding: '8px 12px', borderBottom: '1px solid #5FB4E5', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>{planName}</strong>
                      {plan?.type && <Tag style={{ fontSize: 10 }}>{plan.type}</Tag>}
                    </div>

                    {planInvestments.length > 0 ? (
                      <div style={{ padding: '8px 12px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#00437B', marginBottom: 4 }}>
                          Investments ({planInvestments.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {planInvestments.slice(0, 30).map((inv, i) => (
                            <Tag key={inv.ct_investmentid || i} color={inv.quarterComplete ? 'success' : undefined} style={{ fontSize: 11, margin: 0 }}>{inv.Ref}</Tag>
                          ))}
                          {planInvestments.length > 30 && (
                            <Tag style={{ fontSize: 11, margin: 0, color: '#8c8c8c' }}>+{planInvestments.length - 30} more</Tag>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '8px 12px', fontSize: 12, color: '#8c8c8c' }}>No investments assigned</div>
                    )}

                    {planFc.length > 0 && (
                      <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                        {planFc.filter(fc => fc.changeType === 'inProgress').length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#fa8c16', marginBottom: 4 }}>Fund Changes — In Progress</div>
                            {planFc.filter(fc => fc.changeType === 'inProgress').map((fc, i) => (
                              <div key={fc.id || i} style={{ fontSize: 11, padding: '2px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ color: '#ff4d4f' }}>{fc.currentInvestment || fc.currentFund}</span>
                                <span style={{ color: '#8c8c8c' }}>&rarr;</span>
                                <span style={{ color: '#52c41a' }}>{fc.replacementInvestment || fc.replacementFund}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {planFc.filter(fc => fc.changeType === 'executed').length > 0 && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#52c41a', marginBottom: 4 }}>Fund Changes — Past Year</div>
                            {planFc.filter(fc => fc.changeType === 'executed').map((fc, i) => (
                              <div key={fc.id || i} style={{ fontSize: 11, padding: '2px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ color: '#ff4d4f' }}>{fc.currentInvestment || fc.currentFund}</span>
                                <span style={{ color: '#8c8c8c' }}>&rarr;</span>
                                <span style={{ color: '#52c41a' }}>{fc.replacementInvestment || fc.replacementFund}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Exhibit Pages */}
              {reviewConfig.exhibitPages.length > 0 && (
                <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ background: '#fafafa', padding: '8px 12px', borderBottom: '1px solid #d9d9d9', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UnorderedListOutlined style={{ color: '#3465CD' }} />
                    <strong style={{ fontSize: 13 }}>Exhibits ({reviewConfig.exhibitPages.length})</strong>
                    {reviewConfig.exhibitTemplateName && (
                      <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 'auto' }}>
                        Template: {reviewConfig.exhibitTemplateName}
                        {reviewConfig.isSharedTemplate && <Tag color="purple" style={{ fontSize: 10, marginLeft: 4 }}>Shared</Tag>}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {reviewConfig.exhibitPages.map((page, i) => (
                      <Tag key={page.id || i} color={page.isTab ? 'blue' : undefined} style={{ fontSize: 11, margin: 0 }}>
                        {page.isTab ? 'TAB ' : ''}{page.name.replace(/^TAB - /, '')}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
