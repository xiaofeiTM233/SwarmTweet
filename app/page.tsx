// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Spin, Card, Row, Col, Space, Empty, Button, Input } from 'antd';
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

  // 移动端状态
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileSiderVisible, setMobileSiderVisible] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      // 处理返回结果
      const headers: Record<string, string> = {};
      if (apiKey) headers['x-key'] = apiKey;
      const response = await fetch(`/api/tweets?${params.toString()}`, { headers });
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
      {/* 左侧侧边栏 - 在移动端以悬浮面板展示 */}
      {isMobile ? (
        <>
          {mobileSiderVisible && (
            <>
              <div
                onClick={() => setMobileSiderVisible(false)}
                style={{ position: 'fixed', zIndex: 1190, top: 64, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)' }}
              />
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
                  zIndex: 1200,
                  boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <Button onClick={() => setMobileSiderVisible(false)}>关闭</Button>
                </div>
                <FilterControls onFilterChange={handleFilterChange} authors={state.authors} loading={state.loading} />
              </Sider>
            </>
          )}
        </>
      ) : (
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
          <Input.Password
            placeholder="API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </Sider>
      )}
      <Content style={{ marginLeft: isMobile ? 0 : 280 }}>
        <Card>
          {/* 顶部栏：移动端显示筛选按钮 */}
          <Row justify={isMobile ? 'space-between' : 'end'} style={{ marginBottom: 24 }}>
            {isMobile ? (
              <Col>
                <Button onClick={() => setMobileSiderVisible(true)} style={{ marginRight: 8 }}>筛选</Button>
              </Col>
            ) : null}
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
