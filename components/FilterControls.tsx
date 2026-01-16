// components/FilterControls.tsx
'use client';

import React, { useState } from 'react';
import { Input, Space, DatePicker, Button, Select, Checkbox, Upload, App, Radio, Form } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;

// 三态筛选类型定义
type Tristate = 'yes' | 'no' | 'any';

// 筛选条件数据结构
export interface Filters {
  searchText?: string;
  dateRange?: [string, string];
  author?: string;
  hasMedia: Tristate;
  hasRetweet: Tristate;
  isPrimary: Tristate;
}

interface FilterControlsProps {
  onFilterChange: (filters: Filters) => void;
  authors: { value: string; label: string }[];
  loading: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({ onFilterChange, authors, loading }) => {
  // 筛选状态管理
  const [filters, setFilters] = useState<Filters>({
    hasMedia: 'any',
    hasRetweet: 'any',
    isPrimary: 'yes', // 默认只看主推文
  });
  const { message } = App.useApp();

  // 应用筛选条件
  const handleFilter = () => {
    onFilterChange(filters);
  };
  
  // 筛选条件变化处理
  const handleFilterChange = (changedValues: any, allValues: any) => {
    const newValues: Partial<Filters> = {};

    if ('searchText' in allValues) newValues.searchText = allValues.searchText;
    if ('author' in allValues) newValues.author = allValues.author;
    if ('dateRange' in allValues && Array.isArray(allValues.dateRange) && allValues.dateRange.length === 2) {
      const [start, end] = allValues.dateRange as [Dayjs, Dayjs];
      newValues.dateRange = [start?.toISOString?.() ?? '', end?.toISOString?.() ?? ''];
    }

    if ('hasMedia' in changedValues) newValues.hasMedia = changedValues.hasMedia;
    if ('hasRetweet' in changedValues) newValues.hasRetweet = changedValues.hasRetweet;
    if ('isPrimary' in changedValues) newValues.isPrimary = changedValues.isPrimary;

    setFilters(prev => ({ ...prev, ...newValues }));
  };

  // 文件上传处理
  const handleUpload = async (file: File) => {
    try {
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') {
                    message.error('文件内容格式错误！');
                    return;
                }
                const jsonData = JSON.parse(content);
                const response = await fetch('/api/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData),
                });

                if (response.ok) {
                    message.success('数据导入成功！页面将刷新。');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    const errorData = await response.json();
                    message.error(`导入失败: ${errorData.error}`);
                }
            } catch (jsonError) {
                message.error('解析 JSON 文件失败！请检查文件格式。');
            }
        };
        fileReader.readAsText(file);
    } catch (error) {
        message.error('上传失败！');
    }
    return false;
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <div>
        <h4>导入数据</h4>
        <Upload beforeUpload={handleUpload} maxCount={1} showUploadList={false}>
          <Button icon={<UploadOutlined />}>选择 JSON 文件</Button>
        </Upload>
      </div>

      <div>
        <h4>筛选</h4>
        <Form layout="vertical" onValuesChange={handleFilterChange} initialValues={filters}>
            <Form.Item name="searchText" label="推文内容">
                <Search
                  placeholder="搜索..."
                  onSearch={handleFilter} // 点击搜索或回车时才触发
                  allowClear
                />
            </Form.Item>
            <Form.Item name="author" label="作者">
                <Select
                  placeholder="不限"
                  options={authors}
                  style={{ width: '100%' }}
                  allowClear
                />
            </Form.Item>
            <Form.Item name="dateRange" label="发布日期">
                <RangePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="hasMedia" label="是否包含媒体">
                <Radio.Group>
                    <Radio.Button value="any">不限</Radio.Button>
                    <Radio.Button value="yes">是</Radio.Button>
                    <Radio.Button value="no">否</Radio.Button>
                </Radio.Group>
            </Form.Item>
            <Form.Item name="hasRetweet" label="是否为转帖/引用">
                <Radio.Group>
                    <Radio.Button value="any">不限</Radio.Button>
                    <Radio.Button value="yes">是</Radio.Button>
                    <Radio.Button value="no">否</Radio.Button>
                </Radio.Group>
            </Form.Item>
            <Form.Item name="isPrimary" label="是否为主推文">
                <Radio.Group>
                    <Radio.Button value="any">不限</Radio.Button>
                    <Radio.Button value="yes">是</Radio.Button>
                    <Radio.Button value="no">否</Radio.Button>
                </Radio.Group>
            </Form.Item>
            <Form.Item>
                <Button type="primary" onClick={handleFilter} loading={loading} block>
                  应用筛选
                </Button>
            </Form.Item>
        </Form>
      </div>
    </Space>
  );
};

export default FilterControls;
