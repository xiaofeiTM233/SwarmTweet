// components/TweetMasonry.tsx
import React from 'react';
import { Masonry } from 'antd';
import type { MasonryItemType } from 'antd/es/masonry/MasonryItem';
import { ITweet } from '@/models/Tweet';
import TweetCard from '@/components/TweetCard';

interface TweetMasonryProps {
  tweets: ITweet[];
}

// 瀑布流视图组件
const TweetMasonry: React.FC<TweetMasonryProps> = ({ tweets }) => {
  // 转换为瀑布流所需的数据格式
  const masonryItems: MasonryItemType<ITweet>[] = tweets.map(tweet => ({
    key: tweet.id,
    data: tweet,
  }));
  
  return (
    <Masonry
      items={masonryItems}
      columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
      gutter={16}
      itemRender={(item) => <TweetCard tweet={item.data} />}
    />
  );
};

export default TweetMasonry;
