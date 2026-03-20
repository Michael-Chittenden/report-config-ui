import { Segmented } from 'antd';
import { FileTextOutlined, CopyOutlined, MergeCellsOutlined, TeamOutlined } from '@ant-design/icons';

export default function ConfigTypeSelector({ value, onChange }) {
  return (
    <Segmented
      value={value}
      onChange={onChange}
      size="large"
      options={[
        {
          value: 'single',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
              <FileTextOutlined /> Single Plan
            </span>
          ),
        },
        {
          value: 'multi',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
              <CopyOutlined /> Multi Plan
            </span>
          ),
        },
        {
          value: 'combo',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
              <MergeCellsOutlined /> Combo
            </span>
          ),
        },
        {
          value: 'clientOnly',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
              <TeamOutlined /> Client Only
            </span>
          ),
        },
      ]}
    />
  );
}
