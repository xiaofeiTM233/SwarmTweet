// components/TweetCard.tsx
import React from 'react';
import { Avatar, Card, Image, Space, Tooltip, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { ITweet } from '@/models/Tweet';
import { IMedia } from '@/models/Media';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { parseTweetText, parseSimpleTextWithLinks } from '@/components/textParser'; 

dayjs.extend(relativeTime);

const { Text, Paragraph, Link } = Typography;

interface TweetCardProps {
  tweet: ITweet;
}

// 用户信息 Tooltip 内容组件
const UserTooltip = ({ author }: { author: any }) => {
  const userUrl = `https://x.com/${author.username}`;
  
  return (
    <Space orientation="vertical" size="small">
      <Link href={userUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        <Space align="start">
          <Avatar src={author.profile_image_url} size="large" />
          <div>
            <Text strong style={{ color: 'white' }}>{author.name}</Text>
            <br />
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

// 媒体内容渲染组件
const MediaRenderer: React.FC<{ mediaItem: IMedia }> = ({ mediaItem }) => {
  if (!mediaItem) return null;

  switch (mediaItem.type) {
    case 'photo':
      return mediaItem.url ? (
        <Image
          key={mediaItem.media_key}
          width={150}
          src={mediaItem.url}
          alt="tweet-photo"
        />
      ) : null;

    case 'video':
    case 'animated_gif':
      return mediaItem.preview_image_url ? (
        <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} key={mediaItem.media_key}>
          <Image
            width={150}
            src={mediaItem.preview_image_url}
            alt={mediaItem.type}
            preview={{
              src: mediaItem.preview_image_url,
            }}
          />
          <PlayCircleOutlined
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '32px',
              color: 'white',
              opacity: 0.85,
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : null;

    default:
      return null;
  }
};

// 引用推文卡片组件
const QuotedTweetCard: React.FC<{ tweet: ITweet }> = ({ tweet }) => {
  if (!tweet || !tweet.author_id) return null;
  const author = tweet.author_id as any;
  const fullDate = dayjs(tweet.created_at).format('YYYY-MM-DD HH:mm:ss');
  const tweetUrl = `https://x.com/${author.username}/status/${tweet.id}`;
  const media = (tweet.attachments?.media_keys || []) as any[];

  return (
    <Card size="small" style={{ marginTop: 12, borderColor: '#e8e8e8' }}>
      <Space align="center" size="small">
        <Avatar src={author.profile_image_url} size="small" />
        <Tooltip title={<UserTooltip author={author} />}>
          <Text type="secondary" strong>@{author.username}</Text>
        </Tooltip>
        <Text type="secondary">·</Text>
        <Tooltip title={fullDate}>
          <Link href={tweetUrl} target="_blank" rel="noopener noreferrer" type="secondary">
            {dayjs(tweet.created_at).fromNow()}
          </Link>
        </Tooltip>
      </Space>
      <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
        {parseTweetText(tweet)}
      </Paragraph>
      
      {media.length > 0 && (
        <div style={{ marginTop: 8 }}>
            <Image.PreviewGroup>
              <Space wrap>
                {media.map((mediaItem) => (
                  <MediaRenderer key={mediaItem.media_key} mediaItem={mediaItem} />
                ))}
              </Space>
            </Image.PreviewGroup>
        </div>
      )}
    </Card>
  );
};

// 主推文卡片组件
const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  if (!tweet || !tweet.author_id) return null;

  const author = tweet.author_id as any;
  const media = (tweet.attachments?.media_keys || []) as any[];
  const quotedTweet = tweet.referenced_tweets?.find(rt => rt.type === 'quoted')?.id as any;
  const fullDate = dayjs(tweet.created_at).format('YYYY-MM-DD HH:mm:ss');
  const tweetUrl = `https://x.com/${author.username}/status/${tweet.id}`;

  return (
    <Card 
      style={{ width: '100%' }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <Space align="start">
        <Avatar src={author.profile_image_url} size="large" />
        <div style={{ flex: 1 }}>
          <Space align="center">
            <Tooltip title={<UserTooltip author={author} />}>
              <Text strong>@{author.username}</Text>
            </Tooltip>
            <Text type="secondary">·</Text>
            <Tooltip title={fullDate}>
              <Link href={tweetUrl} target="_blank" rel="noopener noreferrer" type="secondary">
                {dayjs(tweet.created_at).fromNow()}
              </Link>
            </Tooltip>
          </Space>
          <Paragraph style={{ marginTop: 8 }}>
            {parseTweetText(tweet)}
          </Paragraph>
          
          {media.length > 0 && (
            <Image.PreviewGroup>
              <Space wrap>
                {media.map((mediaItem) => (
                  <MediaRenderer key={mediaItem.media_key} mediaItem={mediaItem} />
                ))}
              </Space>
            </Image.PreviewGroup>
          )}

          {quotedTweet && <QuotedTweetCard tweet={quotedTweet} />}
        </div>
      </Space>
    </Card>
  );
};

export default TweetCard;
