// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Spin, Card, Row, Col, Space, Empty } from 'antd';
import FilterControls, { Filters } from '@/components/FilterControls';
import ViewSwitcher, { ViewMode } from '@/components/ViewSwitcher';
import TweetCard from '@/components/TweetCard';
import TweetTable from '@/components/TweetTable';
import TweetMasonry from '@/components/TweetMasonry';
import { ITweet } from '@/models/Tweet';
import { IUser } from '@/models/User';

const { Sider, Content } = Layout;

interface PageState {
  tweets: ITweet[];
  authors: { value: string; label: string }[];
  loading: boolean;
  viewMode: ViewMode;
  filters: Filters;
}

const HomePage: React.FC = () => {
  const [state, setState] = useState<PageState>({
    tweets: [],
    authors: [],
    loading: true,
    viewMode: 'card',
    filters: {
      hasMedia: 'any',
      hasRetweet: 'any',
      isPrimary: 'yes',
    },
  });

  // 获取推文数据
  const fetchTweets = async (currentFilters: Filters) => {
    setState(prevState => ({ ...prevState, loading: true }));
    try {
      const params = new URLSearchParams();
      
      // 构建查询参数
      if (currentFilters.searchText) params.append('searchText', currentFilters.searchText);
      if (currentFilters.dateRange?.[0]) params.append('startDate', new Date(currentFilters.dateRange[0]).toISOString());
      if (currentFilters.dateRange?.[1]) params.append('endDate', new Date(currentFilters.dateRange[1]).toISOString());
      if (currentFilters.author) params.append('author', currentFilters.author);
      
      // 三态筛选参数
      if (currentFilters.hasMedia !== 'any') params.append('hasMedia', currentFilters.hasMedia === 'yes' ? 'true' : 'false');
      if (currentFilters.hasRetweet !== 'any') params.append('hasRetweet', currentFilters.hasRetweet === 'yes' ? 'true' : 'false');
      if (currentFilters.isPrimary !== 'any') params.append('isPrimary', currentFilters.isPrimary);
      
      const response = await fetch(`/api/tweets?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setState(prevState => ({ 
          ...prevState,
          tweets: result.data.tweets,
          authors: prevState.authors.length === 0 ? result.data.authors.map((a: IUser) => ({ value: a.id, label: a.name })) : prevState.authors,
          loading: false
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("获取推文失败:", error);
      setState(prevState => ({ ...prevState, loading: false }));
    }
  };
  
  // 初始化加载
  useEffect(() => {
    fetchTweets(state.filters);
  }, []);
  
  // 筛选条件变化处理
  const handleFilterChange = (newFilters: Filters) => {
    setState(prevState => ({ ...prevState, filters: newFilters }));
    fetchTweets(newFilters);
  };
  
  // 渲染内容区域
  const renderContent = () => {
    // 加载中且无数据
    if (state.loading && state.tweets.length === 0) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Spin size="large" /></div>;
    }
    
    // 无数据
    if (!state.loading && state.tweets.length === 0) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Empty description="没有找到匹配的推文" /></div>;
    }

    // 根据视图模式渲染
    switch (state.viewMode) {
      case 'table':
        return <TweetTable tweets={state.tweets} loading={state.loading} />;
      case 'masonry':
        return <TweetMasonry tweets={state.tweets} />;
      case 'card':
      default:
        return (
          <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
            {state.tweets.map(tweet => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </Space>
        );
    }
  };

  return (
    <Layout>
      <Sider 
        width={280} 
        style={{ 
          background: '#fff', 
          padding: 16, 
          height: '100%', 
          overflow: 'auto',
          position: 'fixed',
          left: 0,
          top: 64,
          bottom: 0,
        }}
      >
        <FilterControls onFilterChange={handleFilterChange} authors={state.authors} loading={state.loading} />
      </Sider>
      <Content style={{ marginLeft: 280 }}>
        <Card>
          <Row justify="end" style={{ marginBottom: 24 }}>
            <Col>
              <ViewSwitcher
                viewMode={state.viewMode}
                onChange={(mode) => setState(prevState => ({ ...prevState, viewMode: mode }))}
              />
            </Col>
          </Row>
          <div style={{ minHeight: 'calc(100vh - 250px)' }}>
            {state.viewMode !== 'table' ? (
               <Spin spinning={state.loading} size="large">
                  {renderContent()}
               </Spin>
            ) : renderContent()}
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default HomePage;
