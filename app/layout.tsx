// app/layout.tsx
import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import GlobalLayout from '@/components/GlobalLayout';

export const metadata = {
  title: 'SwarmTweet​',
  description: '让推文都触手可及。',
};

// 根布局组件
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="zh-cn">
      <body
        style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', margin: 0 }}
      >
        <AntdRegistry>
          <GlobalLayout>
            {children}
          </GlobalLayout>
        </AntdRegistry>
      </body>
    </html>
  );
};

export default RootLayout;
