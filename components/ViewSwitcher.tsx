// components/ViewSwitcher.tsx
import React from 'react';
import { Radio } from 'antd';
import { AppstoreOutlined, BarsOutlined, TableOutlined } from '@ant-design/icons';

// 视图模式类型定义
export type ViewMode = 'card' | 'table' | 'masonry';

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

// 视图切换器组件
const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onChange }) => {
  return (
    <Radio.Group value={viewMode} onChange={(e) => onChange(e.target.value)}>
      <Radio.Button value="card"><BarsOutlined /> 列表</Radio.Button>
      <Radio.Button value="table"><TableOutlined /> 表格</Radio.Button>
      <Radio.Button value="masonry"><AppstoreOutlined /> 瀑布流</Radio.Button>
    </Radio.Group>
  );
};

export default ViewSwitcher;
