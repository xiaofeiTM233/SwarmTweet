// components/TweetCard.tsx
import React from 'react';
import { Avatar, Card, Image, Space, Tooltip, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { IUser } from '@/models/User';
import { parseTweetText, parseSimpleTextWithLinks } from '@/components/textParser';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const CACHER_URL = process.env.NEXT_PUBLIC_CACHER_URL || '';
const { Text, Paragraph, Link } = Typography;

// 用户信息提示框组件
const UserTooltip = ({ author }: { author: IUser }) => {
  const userUrl = `https://x.com/${author.username}`;

  return (
    <Space orientation="vertical" size="small">
      <Link href={userUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        <Space align="start">
          <Avatar src={author.avatar} size="large" />
          <div>
            <Text strong style={{ color: 'white' }}>{author.name}</Text><br />
            <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>@{author.username}</Text>
          </div>
        </Space>
      </Link>
      <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: 0, maxWidth: 300 }}>
        {parseSimpleTextWithLinks(author.description)}
      </Paragraph>
    </Space>
  );
};

// 媒体展示组件
const MediaBox: React.FC<{ mediaItem: any }> = ({ mediaItem }) => {
  if (!mediaItem) return null;
  const isVideo = mediaItem.type === 'video' || mediaItem.type === 'animated_gif';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} key={mediaItem.id}>
      <Image
        width={150}
        src={`${CACHER_URL}${isVideo ? (mediaItem.preview_image_url || mediaItem.url) : mediaItem.url}`}
        alt={mediaItem.alt_text || mediaItem.type}
        preview={{ src: mediaItem.url }}
      />
      {isVideo && (
        <PlayCircleOutlined
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', fontSize: '32px',
            color: 'white', opacity: 0.85, pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

// 引用推文卡片组件
const QuotedTweetCard: React.FC<{ tweet: any }> = ({ tweet }) => {
  if (!tweet || !tweet.author) return null;
  const author = tweet.author;
  const tweetUrl = `https://x.com/${author.username}/status/${tweet.id}`;
  const media = tweet.content.entities?.media || [];

  return (
    <Card size="small" style={{ marginTop: 12, borderColor: '#e8e8e8' }}>
      {/* 作者信息 */}
      <Space align="center" size="small">
        <Avatar src={`${CACHER_URL}${author.avatar}`} size="small" />
        <Tooltip title={<UserTooltip author={author} />}>
          <Text strong>@{author.username}</Text>
        </Tooltip>
        <Text type="secondary">·</Text>
        <Tooltip title={dayjs(tweet.timestamp).format('YYYY-MM-DD HH:mm:ss')}>
          <Link href={tweetUrl} target="_blank" rel="noopener noreferrer" type="secondary">
            {dayjs(tweet.timestamp).fromNow()}
          </Link>
        </Tooltip>
      </Space>
      {/* 推文文本 */}
      <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
        {parseTweetText(tweet)}
      </Paragraph>
      {/* 媒体内容 */}
      {media.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Image.PreviewGroup>
            <Space wrap>
              {media.map((mediaItem: any) => (
                <MediaBox key={mediaItem.id} mediaItem={mediaItem} />
              ))}
            </Space>
          </Image.PreviewGroup>
        </div>
      )}
    </Card>
  );
};

// 主推文卡片组件
const TweetCard: React.FC<{ tweet: any }> = ({ tweet }) => {
  if (!tweet || !tweet.author) return null;
  const author = tweet.author;
  const media = tweet.content.entities?.media || [];
  const quotedTweet = tweet.content.quote;
  const tweetUrl = `https://x.com/${author.username}/status/${tweet.id}`;

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <Space align="start">
        <Avatar src={`${CACHER_URL}${author.avatar}`} size="large" />
        <div style={{ flex: 1 }}>
          {/* 作者信息 */}
          <Space align="center">
            <Tooltip title={<UserTooltip author={author} />}>
              <Text strong>@{author.username}</Text>
            </Tooltip>
            <Text type="secondary">·</Text>
            <Tooltip title={dayjs(tweet.timestamp).format('YYYY-MM-DD HH:mm:ss')}>
              <Link href={tweetUrl} target="_blank" rel="noopener noreferrer" type="secondary">
                {dayjs(tweet.timestamp).fromNow()}
              </Link>
            </Tooltip>
          </Space>
          {/* 推文文本 */}
          <Paragraph style={{ marginTop: 8 }}>
            {parseTweetText(tweet)}
          </Paragraph>
          {/* 媒体内容 */}
          {media.length > 0 && (
            <Image.PreviewGroup>
              <Space wrap>
                {media.map((mediaItem: any) => (
                  <MediaBox key={mediaItem.id} mediaItem={mediaItem} />
                ))}
              </Space>
            </Image.PreviewGroup>
          )}
          {/* 引用推文 */}
          {quotedTweet && <QuotedTweetCard tweet={quotedTweet} />}
        </div>
      </Space>
    </Card>
  );
};

export default TweetCard;
