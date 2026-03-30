import { Modal, Table, Tag, Button, Input, Tooltip, Popconfirm, Divider, Switch, message } from 'antd';
import { SearchOutlined, StarFilled, BranchesOutlined, EditOutlined, CheckOutlined, CloseOutlined, DeleteOutlined, ShareAltOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { reportConfigTypes } from '../data/mockData';
import { resolveUserName } from '../data/dataResolvers';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

// Config type ID → short display string for the config bar
const configTypeToString = { 1: 'single', 2: 'multi', 3: 'combo', 4: 'clientOnly' };

const configTypeToDbType = { single: 1, multi: 2, combo: 3, clientOnly: 4 };

export default function LoadConfigModal({ open, onClose, onSelect, configs = [], plans = [], onRenameConfig, onDeleteConfig, activeConfigType, selectedPlanId, clientAccountId }) {
  const [search, setSearch] = useState('');
  const [showAdHoc, setShowAdHoc] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Look up parent config name for versioning display
  const getParentName = (parentId) => {
    if (!parentId) return null;
    const parent = configs.find(c => c.ReportConfigID === parentId);
    return parent ? parent.ReportConfigName : null;
  };

  const startRename = (record, e) => {
    e.stopPropagation();
    setRenamingId(record.ReportConfigID);
    setRenameValue(record.ReportConfigName);
  };

  const confirmRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      message.warning('Config name cannot be empty');
      return;
    }
    if (onRenameConfig) {
      onRenameConfig(renamingId, trimmed);
      message.success('Config renamed');
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  // Build display rows — filtered to matching config type, showing all configs for the client
  const dbType = activeConfigType ? configTypeToDbType[activeConfigType] : null;
  const adHocCount = configs.filter(c => c.AccountID === clientAccountId && c._isAdHoc && (dbType ? c.ReportConfigType === dbType : true)).length;
  const clientConfigs = configs
    .filter(c => c.AccountID === clientAccountId)
    .filter(c => dbType ? c.ReportConfigType === dbType : true)
    .filter(c => showAdHoc || !c._isAdHoc)
    .map(c => ({
      ...c,
      _savedBy: c._savedBy || resolveUserName(c.UserID),
      _typeName: c._displayType || reportConfigTypes[c.ReportConfigType] || 'Unknown',
    }));

  // CAPTRUST Shared configs (AccountID = null, visible across all clients)
  const sharedConfigs = configs
    .filter(c => c.AccountID === null || c.AccountID === undefined)
    .filter(c => dbType ? c.ReportConfigType === dbType : true)
    .map(c => ({
      ...c,
      _savedBy: c._savedBy || resolveUserName(c.UserID),
      _typeName: c._displayType || reportConfigTypes[c.ReportConfigType] || 'Unknown',
    }));

  const columns = [
    {
      title: 'Name',
      dataIndex: 'ReportConfigName',
      key: 'name',
      sorter: (a, b) => a.ReportConfigName.localeCompare(b.ReportConfigName),
      render: (text, record) => {
        const parentName = getParentName(record.ParentReportConfigID);

        // Inline rename mode
        if (renamingId === record.ReportConfigID) {
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
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined style={{ color: '#52c41a', fontSize: 13 }} />}
                onClick={confirmRename}
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined style={{ color: '#ff4d4f', fontSize: 13 }} />}
                onClick={cancelRename}
              />
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong>{text}</strong>
                {(record.AccountID === null || record.AccountID === undefined) && (
                  <Tag color="purple" style={{ fontSize: 10 }}>
                    <ShareAltOutlined style={{ marginRight: 2 }} />
                    Shared
                  </Tag>
                )}
                {record._isAdHoc && (
                  <Tag color="orange" style={{ fontSize: 10 }}>
                    <ThunderboltOutlined style={{ marginRight: 2 }} />
                    Ad Hoc{record._adHocPeriod ? ` — ${record._adHocPeriod}` : ''}
                  </Tag>
                )}
              </span>
              {parentName && (
                <Tooltip title={`Evolved from: ${parentName}`}>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                    <BranchesOutlined style={{ marginRight: 3 }} />
                    from {parentName}
                  </div>
                </Tooltip>
              )}
            </div>
            <Tooltip title="Rename">
              <EditOutlined
                style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer', marginTop: 4, flexShrink: 0 }}
                onClick={(e) => startRename(record, e)}
              />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: '_typeName',
      key: 'type',
      width: 120,
      sorter: (a, b) => a._typeName.localeCompare(b._typeName),
      render: (type) => (
        <Tag color="blue" style={{ fontSize: 10 }}>
          {type}
        </Tag>
      ),
    },
    // Plan column — only relevant for single plan configs
    ...(activeConfigType === 'single' ? [{
      title: 'Plan',
      dataIndex: 'ct_PlanID',
      key: 'plan',
      width: 140,
      ellipsis: true,
      sorter: (a, b) => {
        const aName = plans.find(p => p.ct_PlanID === a.ct_PlanID)?.name || '';
        const bName = plans.find(p => p.ct_PlanID === b.ct_PlanID)?.name || '';
        return aName.localeCompare(bName);
      },
      render: (planId) => {
        if (!planId) return <span style={{ fontSize: 11, color: '#8c8c8c' }}>—</span>;
        const plan = plans.find(p => p.ct_PlanID === planId);
        const name = plan ? plan.name : `Plan ${planId}`;
        const isCurrent = planId === selectedPlanId;
        return (
          <Tooltip title={name}>
            <span style={{ fontSize: 11, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#00437B' : undefined }}>
              {name}
            </span>
          </Tooltip>
        );
      },
    }] : []),
    {
      title: 'Saved By',
      dataIndex: '_savedBy',
      key: 'savedBy',
      width: 85,
      sorter: (a, b) => a._savedBy.localeCompare(b._savedBy),
      render: (text) => <span style={{ fontSize: 11 }}>{text}</span>,
    },
    {
      title: 'Saved',
      dataIndex: 'LastSaved',
      key: 'lastSaved',
      width: 90,
      sorter: (a, b) => (a.LastSaved || '').localeCompare(b.LastSaved || ''),
      defaultSortOrder: 'descend',
      render: (d) => <span style={{ fontSize: 11 }}>{formatDate(d)}</span>,
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Primary</span>,
      dataIndex: 'Primary',
      key: 'primary',
      width: 75,
      align: 'center',
      sorter: (a, b) => (a.Primary === b.Primary ? 0 : a.Primary ? -1 : 1),
      render: (v) => v ? <Tag color="gold" style={{ fontSize: 10 }}><StarFilled style={{ marginRight: 3 }} />Primary</Tag> : null,
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Bulk</span>,
      dataIndex: 'BulkRun',
      key: 'bulkRun',
      width: 55,
      align: 'center',
      sorter: (a, b) => (a.BulkRun === b.BulkRun ? 0 : a.BulkRun ? -1 : 1),
      render: (v) => v ? <Tag color="green" style={{ fontSize: 10 }}>Bulk</Tag> : null,
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            size="small"
            onClick={() => onSelect(record)}
          >
            Load
          </Button>
          <Popconfirm
            title="Delete this config?"
            description={`"${record.ReportConfigName}" will be removed.`}
            onConfirm={() => {
              if (onDeleteConfig) {
                onDeleteConfig(record.ReportConfigID);
                message.success('Config deleted');
              }
            }}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </span>
      ),
    },
  ];

  const filterData = (data) =>
    data.filter(c => c.ReportConfigName.toLowerCase().includes(search.toLowerCase()));

  const typeLabel = activeConfigType
    ? { single: 'Single Plan', multi: 'Multi Plan', combo: 'Combo', clientOnly: 'Client Only' }[activeConfigType]
    : null;

  return (
    <Modal
      title={typeLabel
        ? `Load Saved Report Configuration — ${typeLabel}`
        : 'Load Saved Report Configuration'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={activeConfigType === 'single' ? 1100 : 950}
    >
      <p style={{ color: '#8c8c8c', marginBottom: 12, fontSize: 13 }}>
        {typeLabel
          ? `Showing ${typeLabel.toLowerCase()} configs for this client. Select a configuration type first to filter by type.`
          : 'Select a configuration type first, then load a matching saved configuration.'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search configs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          style={{ flex: 1 }}
        />
        {adHocCount > 0 && (
          <Tooltip title={showAdHoc ? 'Hide ad hoc report configs' : `Show ${adHocCount} ad hoc report config${adHocCount !== 1 ? 's' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 12, color: '#8c8c8c' }}>
              <ThunderboltOutlined style={{ color: showAdHoc ? '#fa8c16' : '#d9d9d9' }} />
              <span>Ad Hoc</span>
              <Switch size="small" checked={showAdHoc} onChange={setShowAdHoc} />
            </div>
          </Tooltip>
        )}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        Saved configs for current client
      </div>
      <Table
        dataSource={filterData(clientConfigs)}
        columns={columns}
        rowKey="ReportConfigID"
        size="small"
        pagination={false}
        style={{ marginBottom: 16 }}

      />

      {filterData(sharedConfigs).length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            <ShareAltOutlined style={{ marginRight: 4 }} />
            CAPTRUST Shared Configs
          </div>
          <Table
            dataSource={filterData(sharedConfigs)}
            columns={columns}
            rowKey="ReportConfigID"
            size="small"
            pagination={false}
    
          />
        </>
      )}
    </Modal>
  );
}
