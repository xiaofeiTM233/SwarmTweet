// components/GlobalLayout.tsx
'use client';

import React from 'react';
import { App, ConfigProvider, Layout } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import theme from '@/lib/theme';

dayjs.locale('zh-cn');

const { Header, Content } = Layout;

// 全局布局组件
const GlobalLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <App>
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ 
            position: 'fixed',
            zIndex: 2, 
            width: '100%',
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: '#fff', 
            borderBottom: '1px solid #f0f0f0' 
          }}>
            <h1 style={{ display: 'inline-flex', columnGap: 12 }}>
              <img src={'/logo.svg'} draggable={false} alt="logo" style={{ width: 32, display: 'inline-block' }} />
              <span style={{ fontSize: 18 }}>SwarmTweet</span>
            </h1>
          </Header>
          <Content style={{ padding: '24px', marginTop: 64, backgroundColor: '#f5f5ff', height: '100%', display: 'flex' }}>
            {children}
          </Content>
        </Layout>
      </App>
    </ConfigProvider>
  );
};

export default GlobalLayout;
