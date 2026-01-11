// app/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layout, Spin, Card, Row, Col, Space, Empty, Button, Input, Pagination } from 'antd';
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
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
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
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
    loadingMore: false,
  });

  // 移动端状态
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileSiderVisible, setMobileSiderVisible] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 获取推文数据
  const fetchTweets = async (currentFilters: Filters, page = 1, pageSizeParam?: number, isTable = false) => {
    const pageSizeToUse = typeof pageSizeParam === 'number' ? pageSizeParam : state.pageSize;
    // 若为表格分页请求，始终使用 table 的 loading
    if (page === 1 || isTable) {
      setState(prevState => ({ ...prevState, loading: true }));
    } else {
      setState(prevState => ({ ...prevState, loadingMore: true }));
    }
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
      // 分页参数
      params.append('page', String(page));
      params.append('pageSize', String(pageSizeToUse));

      // 处理返回结果
      const headers: Record<string, string> = {};
      if (apiKey) headers['x-key'] = apiKey;
      const response = await fetch(`/api/tweets?${params.toString()}`, { headers });
      const result = await response.json();
      if (result.success) {
        const newTweets: ITweet[] = result.data.tweets || [];
        setState(prevState => ({ 
          ...prevState,
          tweets: isTable || page === 1 ? newTweets : [...prevState.tweets, ...newTweets],
          authors: prevState.authors.length === 0 ? (result.data.authors || []).map((a: IUser) => ({ value: a.id, label: a.name })) : prevState.authors,
          loading: false,
          loadingMore: false,
          page,
          pageSize: pageSizeToUse,
          total: typeof result.data.total === 'number' ? result.data.total : prevState.total,
          hasMore: typeof result.data.total === 'number' ? (pageSizeToUse * page < result.data.total) : (newTweets.length === pageSizeToUse)
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("获取推文失败:", error);
      setState(prevState => ({ ...prevState, loading: false, loadingMore: false }));
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchTweets(state.filters, 1);
  }, []);

  // 筛选条件变化处理
  const handleFilterChange = (newFilters: Filters) => {
    setState(prevState => ({ ...prevState, filters: newFilters, page: 1, hasMore: true }));
    fetchTweets(newFilters, 1);
  };

  // 加载下一页
  const loadMore = () => {
    if (state.loading || state.loadingMore || !state.hasMore) return;
    const nextPage = state.page + 1;
    fetchTweets(state.filters, nextPage);
  };

  // 监听底部 sentinel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (state.viewMode === 'table') return;
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMore();
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0 });

    const el = sentinelRef.current;
    if (el) observerRef.current.observe(el);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
    // 监听变化
  }, [state.viewMode, state.hasMore, state.loading, state.loadingMore, state.filters, state.page]);

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
        return (
          <TweetTable
            tweets={state.loading ? [] : state.tweets}
            loading={state.loading}
            pagination={{
              current: state.page,
              pageSize: state.pageSize,
              total: state.total,
              onChange: (p: number, ps?: number) => {
                const pageSizeToUse = ps || state.pageSize;
                // 表格分页请求
                fetchTweets(state.filters, p, pageSizeToUse, true);
              },
            }}
          />
        );
      case 'masonry':
        return <>
          <TweetMasonry tweets={state.tweets} />
          <div ref={sentinelRef} />
        </>;
      case 'card':
      default:
        return (
          <>
            <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
              {state.tweets.map(tweet => (
                <TweetCard key={tweet.id} tweet={tweet} isList={true} />
              ))}
            </Space>
            <div ref={sentinelRef} />
          </>
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
                onChange={(mode) => {
                  if (mode === 'masonry') {
                    // 瀑布流视图默认每页 20 条
                    setState(prev => ({ ...prev, viewMode: mode, page: 1, pageSize: 20 }));
                    fetchTweets(state.filters, 1, 20);
                  } else {
                    // 其它视图默认每页 10 条
                    setState(prev => ({ ...prev, viewMode: mode, page: 1, pageSize: 10 }));
                    fetchTweets(state.filters, 1, 10);
                  }
                }}
              />
            </Col>
          </Row>
          <div style={{ minHeight: 'calc(100vh - 250px)' }}>
            {renderContent()}
            {/* 加载提示 */}
            {state.loadingMore && state.tweets.length > 0 && (
              <div style={{ textAlign: 'center', padding: 12 }}><Spin /></div>
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default HomePage;
