import { useState } from 'react';
import { Checkbox, Radio, Tag, Space, Switch } from 'antd';
import { ThunderboltOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { bulkTierOverrides, bulkPctThresholds } from '../data/mockData';

export default function BulkRunSection({
  includeInBulk,
  setIncludeInBulk,
  unlocked,
  setUnlocked,
  selectedTierOverride,
  setSelectedTierOverride,
  selectedPctThreshold,
  setSelectedPctThreshold,
}) {
  const [expanded, setExpanded] = useState(false);
  const currentTier = 3;

  // Build override label for collapsed header
  const tierLabel = selectedTierOverride
    ? bulkTierOverrides.find(t => t.id === selectedTierOverride)?.name
    : null;
  const pctLabel = selectedPctThreshold
    ? bulkPctThresholds.find(t => t.id === selectedPctThreshold)?.name
    : null;
  const overrideLabel = tierLabel || pctLabel || null;

  // Combine tier and pct into a single value for the radio group
  // tier options use 'tier-1', 'tier-2', 'tier-3'; pct options use 'pct-1', 'pct-2'
  const combinedValue = selectedTierOverride
    ? `tier-${selectedTierOverride}`
    : selectedPctThreshold
      ? `pct-${selectedPctThreshold}`
      : null;

  const handleOverrideChange = (e) => {
    const val = e.target.value;
    if (val.startsWith('tier-')) {
      setSelectedTierOverride(Number(val.split('-')[1]));
      setSelectedPctThreshold(null);
    } else if (val.startsWith('pct-')) {
      setSelectedPctThreshold(Number(val.split('-')[1]));
      setSelectedTierOverride(null);
    }
  };

  return (
    <div className="config-section">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <h3>
          <ThunderboltOutlined />
          Bulk Run Scheduling
          {includeInBulk && unlocked && overrideLabel && (
            <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>
              Override: {overrideLabel}
            </Tag>
          )}
        </h3>
        {expanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
      </div>
      {expanded && (
        <div className="section-body">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Checkbox
              checked={includeInBulk}
              onChange={(e) => setIncludeInBulk(e.target.checked)}
            >
              <strong>Include in Bulk Run</strong>
            </Checkbox>

            {includeInBulk && (
              <>
                <div style={{ fontSize: 13 }}>
                  Current Tier: <Tag color="blue">Tier {currentTier}</Tag>
                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                    (Based on investment data availability windows)
                  </span>
                </div>

                <div style={{
                  background: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  padding: 16,
                }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <Switch
                        checked={unlocked}
                        onChange={(val) => {
                          setUnlocked(val);
                          if (!val) {
                            setSelectedTierOverride(null);
                            setSelectedPctThreshold(null);
                          }
                        }}
                        size="small"
                      />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        Unlock from default Investment Tier model
                      </span>
                    </div>

                    {unlocked && (
                      <div style={{ paddingLeft: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#595959', marginBottom: 8 }}>
                          Schedule report to run when:
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
                          Choose either a specific data availability tier or a manager data threshold:
                        </div>
                        <Radio.Group
                          value={combinedValue}
                          onChange={handleOverrideChange}
                        >
                          <Space direction="vertical" size={4}>
                            {/* Tier options */}
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
                              Data Availability Tier
                            </div>
                            {bulkTierOverrides.map(opt => (
                              <Radio key={`tier-${opt.id}`} value={`tier-${opt.id}`}>
                                <strong>Run after {opt.name.replace('Force ', '')}</strong>
                                <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>
                                  &mdash; {opt.description}
                                </span>
                              </Radio>
                            ))}

                            {/* Visual separator */}
                            <div style={{ borderTop: '1px solid #f0f0f0', margin: '10px 0' }} />

                            {/* Pct options */}
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
                              Manager Data Threshold
                            </div>
                            {bulkPctThresholds.map(opt => (
                              <Radio key={`pct-${opt.id}`} value={`pct-${opt.id}`}>
                                <strong>{opt.name}</strong>
                                <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>
                                  &mdash; {opt.description}
                                </span>
                              </Radio>
                            ))}
                          </Space>
                        </Radio.Group>
                      </div>
                    )}
                  </Space>
                </div>
              </>
            )}
          </Space>
        </div>
      )}
    </div>
  );
}
