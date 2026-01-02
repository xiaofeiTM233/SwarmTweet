// components/TweetTable.tsx
import React from 'react';
import { Avatar, Space, Table, Typography } from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';

const { Text, Link } = Typography;

interface TweetTableProps {
  tweets: any[];
  loading: boolean;
}

const TweetTable: React.FC<TweetTableProps> = ({ tweets, loading }) => {
  const columns: TableProps<any>['columns'] = [
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      render: (author) => {
        if (!author) return null;
        const userUrl = `https://x.com/${author.username}`;
        return (
          <Link href={userUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            <Space>
              <Avatar src={author.avatar} />
              <div>
                <Text strong>{author.name}</Text><br />
                <Text type="secondary">@{author.username}</Text>
              </div>
            </Space>
          </Link>
        );
      },
    },
    {
      title: '内容',
      dataIndex: ['content', 'text'],
      key: 'text',
      ellipsis: true,
    },
    {
      title: '发布时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts, record) => {
        const author = record.author;
        if (!author) return dayjs(ts).format('YYYY-MM-DD HH:mm');
        const tweetUrl = `https://x.com/${author.username}/status/${record.id}`;
        return (
          <Link href={tweetUrl} target="_blank" rel="noopener noreferrer">
            {dayjs(ts).format('YYYY-MM-DD HH:mm')}
          </Link>
        );
      },
      sorter: (a, b) => a.timestamp - b.timestamp,
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
