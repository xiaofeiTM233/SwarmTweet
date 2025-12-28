// lib/theme.ts
import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    borderRadius: 6,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
  },
};

export default theme;
