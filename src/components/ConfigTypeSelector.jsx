import { Segmented, Tooltip } from 'antd';
import { FileTextOutlined, CopyOutlined, MergeCellsOutlined } from '@ant-design/icons';

const typeDescriptions = {
  single: 'Single Plan — Report for one plan with its investments, fund changes, and exhibit template.',
  multi: 'Consolidated — Combines multiple plans into a unified report. Plan Groups define which plans are included; exhibits can be aggregated or iterate once per plan.',
  combo: 'Combo — Stitches multiple Single Plan and Consolidated report configurations into a single unified report.',
};

export default function ConfigTypeSelector({ value, onChange }) {
  return (
    <div>
      <Segmented
        value={value}
        onChange={onChange}
        size="large"
        options={[
          {
            value: 'single',
            label: (
              <Tooltip title={typeDescriptions.single} placement="bottom">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
                  <FileTextOutlined /> Single Plan
                </span>
              </Tooltip>
            ),
          },
          {
            value: 'multi',
            label: (
              <Tooltip title={typeDescriptions.multi} placement="bottom">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
                  <CopyOutlined /> Consolidated
                </span>
              </Tooltip>
            ),
          },
          {
            value: 'combo',
            label: (
              <Tooltip title={typeDescriptions.combo} placement="bottom">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
                  <MergeCellsOutlined /> Combo
                </span>
              </Tooltip>
            ),
          },
        ]}
      />
      {value && typeDescriptions[value] && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#595959', maxWidth: 560, lineHeight: 1.5 }}>
          {typeDescriptions[value]}
        </div>
      )}
    </div>
  );
}
