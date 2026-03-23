import { useState, useMemo } from 'react';
import { Select, Button, Modal, Table, Tag, Divider, Space, Input, Popconfirm, Checkbox, Alert, message } from 'antd';
import { UnorderedListOutlined, DownOutlined, RightOutlined, SaveOutlined, StarFilled, FileTextOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined, ShareAltOutlined, WarningOutlined, LockOutlined } from '@ant-design/icons';
import { pagesets, pagesetCategories, exhibitMenuTypes, exhibitTemplateConfigs as seedTemplates } from '../data/mockData';
import { resolveExhibitPageSetIds, resolveExhibitIds } from '../data/dataResolvers';
import DualListBox from './DualListBox';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

// Categories that are only available for single plan configs
const singlePlanOnlyCategoryIds = new Set([2, 6, 7]);
// Categories that are only available for multi plan configs (not combo)
const multiPlanOnlyCategoryIds = new Set([3]);

export default function ExhibitMenuSection({
  configType = 'single',
  selectedExhibitIds,
  setSelectedExhibitIds,
  exhibitTemplateName,
  setExhibitTemplateName,
  exhibitTemplateId,
  setExhibitTemplateId,
  categoryId,
  setCategoryId,
  // Lifted template management from App.jsx
  allTemplates,
  allConfigs = [],
  onSaveTemplate,
  onUpdateTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  clientAccountId,
  // Multi plan only — individual summaries checkbox
  includeIndividualSummaries,
  setIncludeIndividualSummaries,
  // Permission: can this user modify shared templates?
  isTemplateAdmin = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [saveAsShared, setSaveAsShared] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [sharedConfirmOpen, setSharedConfirmOpen] = useState(false);
  const [sharedConfirmAction, setSharedConfirmAction] = useState(null); // { type: 'update' | 'delete', templateId, templateName, configCount }
  const [detachConfirmOpen, setDetachConfirmOpen] = useState(false);
  const [pendingDetachAction, setPendingDetachAction] = useState(null); // { type: 'load' | 'saveNew', payload }
  const [permissionDeniedOpen, setPermissionDeniedOpen] = useState(false);

  // Use the isTemplateAdmin prop from App.jsx (toggled via Demo Data admin)
  const canModifySharedTemplates = isTemplateAdmin;

  // Resolve IDs to full exhibit objects
  const selectedExhibits = useMemo(() => resolveExhibitIds(selectedExhibitIds), [selectedExhibitIds]);

  const availableExhibits = useMemo(() => {
    return pagesets
      .filter(p => p.categoryId === categoryId)
      .filter(p => !selectedExhibitIds.includes(p.id));
  }, [categoryId, selectedExhibitIds]);

  const isSinglePlanOnlyCategory = (catId) => configType !== 'single' && singlePlanOnlyCategoryIds.has(catId);
  const isMultiPlanOnlyCategory = (catId) => configType === 'combo' && multiPlanOnlyCategoryIds.has(catId);

  const categoryOptions = useMemo(() =>
    pagesetCategories.map(c => {
      const singleOnly = isSinglePlanOnlyCategory(c.id);
      const multiOnly = isMultiPlanOnlyCategory(c.id);
      const disabled = singleOnly || multiOnly;
      let label = c.name;
      if (singleOnly) label = `${c.name} (Single Plan Only)`;
      else if (multiOnly) label = `${c.name} (Multi Plan Only)`;
      return { value: c.id, label, disabled };
    }),
    [configType]
  );

  // Filter templates by config type (shared vs client-specific ExhibitTemplateTypes)
  const typeMap = {
    single: { shared: [1], clientOnly: [3] },
    multi: { shared: [2], clientOnly: [4] },
    combo: { shared: [], clientOnly: [5] },
  };
  const mapping = typeMap[configType] || { shared: [], clientOnly: [] };

  const templates = allTemplates || seedTemplates;
  const clientTemplates = useMemo(() =>
    templates.filter(t => mapping.clientOnly.includes(t.ExhibitTemplateType) && t.AccountID === clientAccountId),
    [templates, mapping.clientOnly, clientAccountId]
  );
  const sharedTemplates = useMemo(() =>
    templates.filter(t => mapping.shared.includes(t.ExhibitTemplateType)),
    [templates, mapping.shared]
  );

  const handleDualListChange = (newSelected) => {
    setSelectedExhibitIds(newSelected.map(e => e.id));
  };

  // Check if the currently active template is a shared template
  const isCurrentTemplateShared = useMemo(() => {
    if (!exhibitTemplateId) return false;
    const tmpl = templates.find(t => t.ExhibitTemplateID === exhibitTemplateId);
    return tmpl ? (tmpl.ExhibitTemplateType === 1 || tmpl.ExhibitTemplateType === 2) : false;
  }, [exhibitTemplateId, templates]);

  const currentSharedTemplateName = useMemo(() => {
    if (!isCurrentTemplateShared || !exhibitTemplateId) return null;
    const tmpl = templates.find(t => t.ExhibitTemplateID === exhibitTemplateId);
    return tmpl ? tmpl.Name : null;
  }, [isCurrentTemplateShared, exhibitTemplateId, templates]);

  // Load template — check if detaching from a shared template first
  const handleLoadTemplate = (template) => {
    // If switching away from a shared template to a different template, warn
    if (isCurrentTemplateShared && template.ExhibitTemplateID !== exhibitTemplateId) {
      setPendingDetachAction({ type: 'load', payload: template });
      setDetachConfirmOpen(true);
      return;
    }
    doLoadTemplate(template);
  };

  const doLoadTemplate = (template) => {
    if (template._sessionIds) {
      setSelectedExhibitIds(template._sessionIds);
    } else {
      const ids = resolveExhibitPageSetIds(template.ExhibitTemplateID);
      setSelectedExhibitIds(ids);
    }
    setExhibitTemplateName(template.Name);
    if (setExhibitTemplateId) setExhibitTemplateId(template.ExhibitTemplateID);
    message.success(`Loaded template: ${template.Name}`);
    setTemplateModalOpen(false);
  };

  // Save new template — check if detaching from a shared template first
  const handleSaveNewTemplate = () => {
    if (!saveTemplateName.trim()) return;
    if (isCurrentTemplateShared) {
      setPendingDetachAction({ type: 'saveNew' });
      setDetachConfirmOpen(true);
      return;
    }
    doSaveNewTemplate();
  };

  const doSaveNewTemplate = () => {
    // Shared templates use ExhibitTemplateType 1 (single) or 2 (multi); client-only use 3/4/5
    const sharedTypeMap = { single: 1, multi: 2 };
    const clientTypeMap = { single: 3, multi: 4, combo: 5 };
    const templateType = saveAsShared
      ? (sharedTypeMap[configType] || 3)
      : (clientTypeMap[configType] || 3);
    const newTemplate = {
      ExhibitTemplateID: Date.now(),
      ExhibitTemplateType: templateType,
      Name: saveTemplateName,
      IndvAssetSummaries: false,
      LastSavedBy: 'You',
      LastSaved: new Date().toISOString(),
      AccountID: saveAsShared ? null : (clientAccountId || null),
      _sessionIds: [...selectedExhibitIds],
    };
    if (onSaveTemplate) {
      onSaveTemplate(newTemplate);
    }
    setExhibitTemplateName(saveTemplateName);
    if (setExhibitTemplateId) setExhibitTemplateId(newTemplate.ExhibitTemplateID);
    setSaveTemplateName('');
    setSaveAsShared(false);
    const sharedNote = saveAsShared ? ' (shared)' : '';
    message.success(`Saved template: ${saveTemplateName}${sharedNote}`);
  };

  // Handle detach confirmation
  const handleDetachConfirm = () => {
    if (!pendingDetachAction) return;
    if (pendingDetachAction.type === 'load') {
      doLoadTemplate(pendingDetachAction.payload);
    } else if (pendingDetachAction.type === 'saveNew') {
      doSaveNewTemplate();
    }
    setDetachConfirmOpen(false);
    setPendingDetachAction(null);
  };

  // Check if a template is shared (CAPTRUST-wide) and count associated report configs
  const getSharedTemplateInfo = (templateId) => {
    const tmpl = templates.find(t => t.ExhibitTemplateID === templateId);
    if (!tmpl) return { isShared: false, configCount: 0 };
    const isShared = tmpl.ExhibitTemplateType === 1 || tmpl.ExhibitTemplateType === 2;
    const configCount = allConfigs.filter(c => c.ExhibitTemplateID === templateId).length;
    return { isShared, configCount, templateName: tmpl.Name };
  };

  // Update existing template in-place — with shared template confirmation & permission check
  const handleUpdateExistingTemplate = () => {
    if (!exhibitTemplateId) return;
    const { isShared, configCount, templateName } = getSharedTemplateInfo(exhibitTemplateId);
    if (isShared) {
      if (!canModifySharedTemplates) {
        setPermissionDeniedOpen(true);
        return;
      }
      setSharedConfirmAction({ type: 'update', templateId: exhibitTemplateId, templateName, configCount });
      setSharedConfirmOpen(true);
      return;
    }
    doUpdateTemplate(exhibitTemplateId);
  };

  const doUpdateTemplate = (templateId) => {
    if (onUpdateTemplate) {
      onUpdateTemplate(templateId, selectedExhibitIds);
    }
    message.success(`Updated template: ${exhibitTemplateName}`);
  };

  const startRename = (record, e) => {
    e.stopPropagation();
    setRenamingId(record.ExhibitTemplateID);
    setRenameValue(record.Name);
  };

  const confirmRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      message.warning('Template name cannot be empty');
      return;
    }
    if (onRenameTemplate) {
      onRenameTemplate(renamingId, trimmed);
    }
    if (exhibitTemplateId === renamingId) {
      setExhibitTemplateName(trimmed);
    }
    message.success('Template renamed');
    setRenamingId(null);
    setRenameValue('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDeleteTemplateClick = (templateId) => {
    const { isShared, configCount, templateName } = getSharedTemplateInfo(templateId);
    if (isShared) {
      if (!canModifySharedTemplates) {
        setPermissionDeniedOpen(true);
        return;
      }
      setSharedConfirmAction({ type: 'delete', templateId, templateName, configCount });
      setSharedConfirmOpen(true);
      return;
    }
    doDeleteTemplate(templateId);
  };

  const doDeleteTemplate = (templateId) => {
    if (onDeleteTemplate) {
      onDeleteTemplate(templateId);
    }
    if (exhibitTemplateId === templateId) {
      setExhibitTemplateName(null);
      if (setExhibitTemplateId) setExhibitTemplateId(null);
    }
    message.success('Template deleted');
  };

  // Handle shared template confirmation
  const handleSharedConfirm = () => {
    if (!sharedConfirmAction) return;
    if (sharedConfirmAction.type === 'update') {
      doUpdateTemplate(sharedConfirmAction.templateId);
    } else if (sharedConfirmAction.type === 'delete') {
      doDeleteTemplate(sharedConfirmAction.templateId);
    }
    setSharedConfirmOpen(false);
    setSharedConfirmAction(null);
  };

  const templateColumns = [
    {
      title: 'Name',
      dataIndex: 'Name',
      key: 'name',
      render: (text, record) => {
        if (renamingId === record.ExhibitTemplateID) {
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
      title: 'Type',
      dataIndex: 'ExhibitTemplateType',
      key: 'type',
      width: 160,
      render: (typeId) => {
        const typeName = exhibitMenuTypes[typeId] || 'Unknown';
        const isShared = typeId === 1 || typeId === 2;
        return (
          <Tag color={isShared ? 'purple' : 'blue'} style={{ fontSize: 10 }}>
            {typeName}
          </Tag>
        );
      },
    },
    {
      title: 'Saved By',
      dataIndex: 'LastSavedBy',
      key: 'savedBy',
      width: 100,
      render: (text) => <span style={{ fontSize: 12 }}>{text}</span>,
    },
    {
      title: 'Saved',
      dataIndex: 'LastSaved',
      key: 'lastSaved',
      width: 100,
      render: (d) => <span style={{ fontSize: 12 }}>{formatDate(d)}</span>,
    },
    {
      title: '',
      key: 'action',
      width: 110,
      render: (_, record) => {
        const isShared = record.ExhibitTemplateType === 1 || record.ExhibitTemplateType === 2;
        return (
          <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button type="primary" size="small" onClick={() => handleLoadTemplate(record)}>Load</Button>
            {isShared ? (
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTemplateClick(record.ExhibitTemplateID)}
              />
            ) : (
              <Popconfirm
                title="Delete this template?"
                description={`"${record.Name}" will be removed.`}
                onConfirm={() => doDeleteTemplate(record.ExhibitTemplateID)}
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
            )}
          </span>
        );
      },
    },
  ];

  return (
    <div className="config-section">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <h3>
          <UnorderedListOutlined />
          Exhibit Menu
          <Tag style={{ marginLeft: 8, fontSize: 11 }}>
            {selectedExhibitIds.length} exhibits selected
          </Tag>
          {exhibitTemplateName && (
            <Tag color="cyan" style={{ marginLeft: 4, fontSize: 11 }}>
              <FileTextOutlined style={{ marginRight: 3 }} />
              {exhibitTemplateName}
            </Tag>
          )}
        </h3>
        {expanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
      </div>
      {expanded && (
        <div className="section-body">
          {/* Active template banner */}
          {exhibitTemplateName ? (
            <div style={{
              background: '#e6fffb',
              border: '1px solid #87e8de',
              borderRadius: 6,
              padding: '8px 16px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
            }}>
              <Space>
                <FileTextOutlined style={{ color: '#13c2c2' }} />
                <span style={{ color: '#8c8c8c' }}>Exhibit Template:</span>
                <strong>{exhibitTemplateName}</strong>
              </Space>
            </div>
          ) : (
            <div style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 6,
              padding: '8px 16px',
              marginBottom: 12,
              fontSize: 13,
              color: '#8c8c8c',
            }}>
              <FileTextOutlined style={{ color: '#faad14', marginRight: 8 }} />
              No exhibit template associated. Save or load a template below.
            </div>
          )}

          {/* Include individual plan summaries — multi plan only */}
          {configType === 'multi' && setIncludeIndividualSummaries && (
            <div style={{
              background: includeIndividualSummaries ? '#f0f5ff' : '#fafafa',
              border: `1px solid ${includeIndividualSummaries ? '#adc6ff' : '#d9d9d9'}`,
              borderRadius: 6,
              padding: '10px 16px',
              marginBottom: 12,
              transition: 'all 0.2s',
            }}>
              <Checkbox
                checked={includeIndividualSummaries}
                onChange={(e) => setIncludeIndividualSummaries(e.target.checked)}
              >
                <strong>Include individual plan Asset Summaries</strong>
                <Tag style={{ marginLeft: 8, fontSize: 10 }}>Multi Plan Only</Tag>
              </Checkbox>
              {includeIndividualSummaries && (
                <div style={{
                  background: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 4,
                  padding: '8px 12px',
                  marginTop: 8,
                  fontSize: 12,
                  color: '#8c6d1f',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                }}>
                  <WarningOutlined style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>
                    Individual plan summaries will only be included if the <strong>Multi Asset Valuation Summary</strong> exhibit
                    is added to the exhibit template. Make sure it is included in your selected exhibits below.
                  </span>
                </div>
              )}
            </div>
          )}

          <Space size="middle" style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={() => setTemplateModalOpen(true)}>
              Load Exhibit Template
            </Button>
            <Space>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Category:</span>
              <Select
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
                style={{ width: 320 }}
              />
            </Space>
          </Space>

          <DualListBox
            selectedItems={selectedExhibits}
            availableItems={availableExhibits}
            onSelectedChange={handleDualListChange}
            selectedTitle="Selected Exhibits"
            availableTitle="Available Exhibits"
          />

          <div className="section-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {exhibitTemplateId ? (
              <>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  size="small"
                  onClick={handleUpdateExistingTemplate}
                  disabled={selectedExhibitIds.length === 0}
                >
                  Save Template
                </Button>
                <div style={{ borderLeft: '1px solid #d9d9d9', height: 20 }} />
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Save As New:</span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Save Exhibit Template:</span>
            )}
            <Input
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              placeholder="New template name..."
              size="small"
              style={{ width: 220 }}
              onPressEnter={handleSaveNewTemplate}
            />
            <Button
              icon={<SaveOutlined />}
              size="small"
              onClick={handleSaveNewTemplate}
              disabled={!saveTemplateName.trim()}
            >
              {exhibitTemplateId ? 'Save As New' : 'Save'}
            </Button>
            <div style={{ borderLeft: '1px solid #d9d9d9', height: 20 }} />
            {canModifySharedTemplates ? (
              <Checkbox
                checked={saveAsShared}
                onChange={(e) => setSaveAsShared(e.target.checked)}
              >
                <Space size={4}>
                  <ShareAltOutlined style={{ color: saveAsShared ? '#722ed1' : '#8c8c8c' }} />
                  <span style={{ fontSize: 12, color: saveAsShared ? '#722ed1' : '#8c8c8c' }}>
                    Share as CAPTRUST Template
                  </span>
                </Space>
              </Checkbox>
            ) : (
              <Space size={4} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <LockOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Share as CAPTRUST Template — requires template admin permissions
                </span>
              </Space>
            )}
          </div>

          {/* Load Template Modal */}
          <Modal
            title="Load Exhibit Template"
            open={templateModalOpen}
            onCancel={() => setTemplateModalOpen(false)}
            footer={null}
            width={850}
          >
            <p style={{ color: '#8c8c8c', marginBottom: 12, fontSize: 13 }}>
              Select an exhibit template to load. This will replace your current exhibit selection.
            </p>

            <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Client Exhibit Templates
            </div>
            <Table
              dataSource={clientTemplates}
              columns={templateColumns}
              rowKey="ExhibitTemplateID"
              size="small"
              pagination={false}
              style={{ marginBottom: 16 }}
            />

            {sharedTemplates.length > 0 && (
              <>
                <Divider style={{ margin: '8px 0' }} />

                <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  CAPTRUST Shared Templates
                </div>
                <Table
                  dataSource={sharedTemplates}
                  columns={templateColumns}
                  rowKey="ExhibitTemplateID"
                  size="small"
                  pagination={false}
                />
              </>
            )}
          </Modal>

          {/* Shared Template Modification Confirmation */}
          <Modal
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14', fontSize: 18 }} />
                <span>
                  {sharedConfirmAction?.type === 'delete' ? 'Delete' : 'Modify'} Shared Exhibit Template
                </span>
              </Space>
            }
            open={sharedConfirmOpen}
            onCancel={() => { setSharedConfirmOpen(false); setSharedConfirmAction(null); }}
            onOk={handleSharedConfirm}
            okText={sharedConfirmAction?.type === 'delete' ? 'Delete Shared Template' : 'Update Shared Template'}
            okButtonProps={{ danger: sharedConfirmAction?.type === 'delete' }}
            width={520}
          >
            {sharedConfirmAction && (
              <div>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  <strong>"{sharedConfirmAction.templateName}"</strong> is a{' '}
                  <Tag color="purple" style={{ fontSize: 11 }}>CAPTRUST Shared</Tag>{' '}
                  exhibit template.
                </p>

                {sharedConfirmAction.configCount > 0 ? (
                  <div style={{
                    background: '#fff7e6',
                    border: '1px solid #ffd591',
                    borderRadius: 6,
                    padding: '12px 16px',
                    marginBottom: 16,
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#d46b08' }}>
                      <WarningOutlined style={{ marginRight: 6 }} />
                      {sharedConfirmAction.type === 'delete' ? 'Deleting' : 'Updating'} this template will impact{' '}
                      <strong>{sharedConfirmAction.configCount}</strong>{' '}
                      report configuration{sharedConfirmAction.configCount !== 1 ? 's' : ''} across all clients that reference it.
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                      {sharedConfirmAction.type === 'delete'
                        ? 'Those configurations will lose their exhibit template association.'
                        : 'Those configurations will use the updated exhibit selections the next time they are run.'
                      }
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 6,
                    padding: '12px 16px',
                    marginBottom: 16,
                    fontSize: 13,
                  }}>
                    No report configurations currently reference this template.
                  </div>
                )}

                <p style={{ fontSize: 13, color: '#595959' }}>
                  {sharedConfirmAction.type === 'delete'
                    ? 'Are you sure you want to permanently delete this shared template?'
                    : 'Are you sure you want to save these changes to the shared template?'
                  }
                </p>
              </div>
            )}
          </Modal>

          {/* Permission Denied Modal — non-provisioned users cannot modify shared templates */}
          <Modal
            title={
              <Space>
                <WarningOutlined style={{ color: '#fa541c', fontSize: 18 }} />
                <span>Permission Required</span>
              </Space>
            }
            open={permissionDeniedOpen}
            onCancel={() => setPermissionDeniedOpen(false)}
            footer={[
              <Button key="ok" type="primary" onClick={() => setPermissionDeniedOpen(false)}>
                OK
              </Button>,
            ]}
            width={480}
          >
            <p style={{ fontSize: 14, marginBottom: 12 }}>
              You do not have permission to modify shared CAPTRUST exhibit templates.
            </p>
            <div style={{
              background: '#fff2e8',
              border: '1px solid #ffbb96',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: '#ad2102' }}>
                Only provisioned template administrators can update or delete shared templates.
              </div>
              <div style={{ fontSize: 13, color: '#595959' }}>
                To customize your exhibit selections, save a new client-specific template using the
                <strong> "Save As New"</strong> option below the exhibit list. This will create a template
                specific to this client that you can freely modify.
              </div>
            </div>
          </Modal>

          {/* Detach from Shared Template Confirmation */}
          <Modal
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14', fontSize: 18 }} />
                <span>Detaching from Shared Exhibit Template</span>
              </Space>
            }
            open={detachConfirmOpen}
            onCancel={() => { setDetachConfirmOpen(false); setPendingDetachAction(null); }}
            onOk={handleDetachConfirm}
            okText={pendingDetachAction?.type === 'load' ? 'Load & Detach' : 'Save New & Detach'}
            width={520}
          >
            <p style={{ fontSize: 14, marginBottom: 12 }}>
              This report configuration is currently using the shared exhibit template{' '}
              <strong>"{currentSharedTemplateName}"</strong>.
            </p>

            <div style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: '#d46b08' }}>
                <WarningOutlined style={{ marginRight: 6 }} />
                You are about to detach from the shared template
              </div>
              <div style={{ fontSize: 13, color: '#595959' }}>
                {pendingDetachAction?.type === 'load'
                  ? <>Loading <strong>"{pendingDetachAction.payload?.Name}"</strong> will replace the shared template association.</>
                  : <>Saving a new template will replace the shared template association.</>
                }
              </div>
              <div style={{ fontSize: 13, color: '#595959', marginTop: 6 }}>
                Once detached, any future updates to <strong>"{currentSharedTemplateName}"</strong> will{' '}
                <strong>no longer be reflected</strong> in this report configuration. All exhibit selections
                will need to be managed independently going forward.
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#595959' }}>
              Do you want to proceed?
            </p>
          </Modal>
        </div>
      )}
    </div>
  );
}
