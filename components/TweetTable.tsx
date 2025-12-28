// components/TweetTable.tsx
import React from 'react';
import { Avatar, Space, Table, Typography } from 'antd';
import type { TableProps } from 'antd';
import { ITweet } from '@/models/Tweet';
import dayjs from 'dayjs';

const { Text, Link } = Typography;

interface TweetTableProps {
  tweets: ITweet[];
  loading: boolean;
}

const TweetTable: React.FC<TweetTableProps> = ({ tweets, loading }) => {
  // 表格列配置
  const columns: TableProps<ITweet>['columns'] = [
    {
      title: '作者',
      dataIndex: 'author_id',
      key: 'author',
      render: (author) => {
        if (!author) return null;
        const userUrl = `https://x.com/${author.username}`;
        return (
          <Link href={userUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            <Space>
              <Avatar src={author.profile_image_url} />
              <div>
                <Text strong>{author.name}</Text>
                <br />
                <Text type="secondary">@{author.username}</Text>
              </div>
            </Space>
          </Link>
        );
      },
    },
    {
      title: '内容',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'createdAt',
      // 时间列渲染函数
      render: (date, record) => {
        const author = record.author_id as any;
        if (!author || !record.id) return dayjs(date).format('YYYY-MM-DD HH:mm');
        
        // 构建原帖链接
        const tweetUrl = `https://x.com/${author.username}/status/${record.id}`;
        
        return (
          <Link href={tweetUrl} target="_blank" rel="noopener noreferrer">
            {dayjs(date).format('YYYY-MM-DD HH:mm')}
          </Link>
        );
      },
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={tweets} 
      rowKey="id" 
      loading={loading} 
      size="small" 
      styles={{
        body: { cell: { padding: '8px 12px' } },
        header: { cell: { padding: '8px 12px' } }
      }}
    />
  );
};

export default TweetTable;
