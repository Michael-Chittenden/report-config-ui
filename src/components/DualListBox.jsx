import { useState } from 'react';
import { Button, Input } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  UpOutlined,
  DownOutlined,
  SearchOutlined,
  HolderOutlined,
} from '@ant-design/icons';

export default function DualListBox({
  selectedItems,
  availableItems,
  onSelectedChange,
  selectedTitle = 'Selected',
  availableTitle = 'Available',
  renderItem,
}) {
  const [selectedHighlight, setSelectedHighlight] = useState([]);
  const [availableHighlight, setAvailableHighlight] = useState([]);
  const [selectedSearch, setSelectedSearch] = useState('');
  const [availableSearch, setAvailableSearch] = useState('');

  const filteredSelected = selectedItems.filter(item => {
    const name = typeof item === 'string' ? item : item.name;
    return name.toLowerCase().includes(selectedSearch.toLowerCase());
  });

  const filteredAvailable = availableItems.filter(item => {
    const name = typeof item === 'string' ? item : item.name;
    return name.toLowerCase().includes(availableSearch.toLowerCase());
  });

  const getName = (item) => typeof item === 'string' ? item : item.name;
  const getId = (item) => typeof item === 'string' ? item : item.id;

  const moveToSelected = () => {
    if (availableHighlight.length === 0) return;
    const toMove = availableItems.filter(item => availableHighlight.includes(getId(item)));
    const remaining = availableItems.filter(item => !availableHighlight.includes(getId(item)));
    onSelectedChange([...selectedItems, ...toMove], remaining);
    setAvailableHighlight([]);
  };

  const moveToAvailable = () => {
    if (selectedHighlight.length === 0) return;
    const toMove = selectedItems.filter(item => selectedHighlight.includes(getId(item)));
    const remaining = selectedItems.filter(item => !selectedHighlight.includes(getId(item)));
    onSelectedChange(remaining, [...availableItems, ...toMove]);
    setSelectedHighlight([]);
  };

  const moveAllToSelected = () => {
    onSelectedChange([...selectedItems, ...availableItems], []);
    setAvailableHighlight([]);
  };

  const moveAllToAvailable = () => {
    onSelectedChange([], [...availableItems, ...selectedItems]);
    setSelectedHighlight([]);
  };

  const moveUp = () => {
    if (selectedHighlight.length === 0) return;
    const newItems = [...selectedItems];
    // Get indices of highlighted items, sorted ascending
    const indices = selectedHighlight
      .map(id => newItems.findIndex(item => getId(item) === id))
      .filter(i => i >= 0)
      .sort((a, b) => a - b);
    // Can't move up if the first highlighted item is already at the top
    if (indices[0] <= 0) return;
    // Move each highlighted item up by one, processing top-to-bottom
    for (const idx of indices) {
      [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
    }
    onSelectedChange(newItems, availableItems);
  };

  const moveDown = () => {
    if (selectedHighlight.length === 0) return;
    const newItems = [...selectedItems];
    // Get indices of highlighted items, sorted descending
    const indices = selectedHighlight
      .map(id => newItems.findIndex(item => getId(item) === id))
      .filter(i => i >= 0)
      .sort((a, b) => b - a);
    // Can't move down if the last highlighted item is already at the bottom
    if (indices[0] >= newItems.length - 1) return;
    // Move each highlighted item down by one, processing bottom-to-top
    for (const idx of indices) {
      [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
    }
    onSelectedChange(newItems, availableItems);
  };

  const toggleHighlight = (id, list, setList) => {
    setList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="dual-list-container">
      {/* Selected Panel */}
      <div className="dual-list-panel">
        <div className="panel-header">
          <span>{selectedTitle}</span>
          <span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>
            {selectedItems.length} items
          </span>
        </div>
        <div style={{ padding: '4px 4px 0' }}>
          <Input
            size="small"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Filter..."
            value={selectedSearch}
            onChange={(e) => setSelectedSearch(e.target.value)}
          />
        </div>
        <div className="panel-body">
          {filteredSelected.map((item, idx) => (
            <div
              key={getId(item)}
              className={`dual-list-item ${selectedHighlight.includes(getId(item)) ? 'selected' : ''}`}
              onClick={() => toggleHighlight(getId(item), selectedHighlight, setSelectedHighlight)}
            >
              <HolderOutlined className="drag-handle" style={{ color: '#d9d9d9', fontSize: 11 }} />
              <span>{renderItem ? renderItem(item) : getName(item)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reorder + Transfer Buttons */}
      <div className="dual-list-actions">
        <Button size="small" icon={<UpOutlined />} onClick={moveUp} title="Move up" />
        <Button size="small" icon={<DownOutlined />} onClick={moveDown} title="Move down" />
        <div style={{ height: 8 }} />
        <Button size="small" icon={<LeftOutlined />} onClick={moveToSelected} title="Add selected" />
        <Button size="small" icon={<RightOutlined />} onClick={moveToAvailable} title="Remove selected" />
        <div style={{ height: 4 }} />
        <Button size="small" icon={<DoubleLeftOutlined />} onClick={moveAllToSelected} title="Add all" />
        <Button size="small" icon={<DoubleRightOutlined />} onClick={moveAllToAvailable} title="Remove all" />
      </div>

      {/* Available Panel */}
      <div className="dual-list-panel">
        <div className="panel-header">
          <span>{availableTitle}</span>
          <span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>
            {availableItems.length} items
          </span>
        </div>
        <div style={{ padding: '4px 4px 0' }}>
          <Input
            size="small"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Filter..."
            value={availableSearch}
            onChange={(e) => setAvailableSearch(e.target.value)}
          />
        </div>
        <div className="panel-body">
          {filteredAvailable.map(item => (
            <div
              key={getId(item)}
              className={`dual-list-item ${availableHighlight.includes(getId(item)) ? 'selected' : ''}`}
              onClick={() => toggleHighlight(getId(item), availableHighlight, setAvailableHighlight)}
            >
              <span>{renderItem ? renderItem(item) : getName(item)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
