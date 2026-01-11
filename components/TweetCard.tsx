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
          <Avatar src={`${CACHER_URL}${author.avatar}`} size="large" />
          <div>
            <Text strong style={{ color: 'white' }}>{author.name}</Text><br />
            <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>@{author.username}</Text>
          </div>
        </Space>
      </Link>
      <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 300 }}>
        {parseSimpleTextWithLinks(author.description)}
      </Paragraph>
    </Space>
  );
};

// 媒体列表组件
const MediaBox: React.FC<{ mediaItem: any }> = ({ mediaItem }) => {
  if (!mediaItem) return null;
  const isVideo = mediaItem.type === 'video' || mediaItem.type === 'animated_gif';
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} key={mediaItem.id}>
      <Image
        width={150}
        src={`${CACHER_URL}${isVideo ? (mediaItem.preview_image_url || mediaItem.url) : mediaItem.url}`}
        alt={mediaItem.alt_text || mediaItem.type}
        preview={{ src: `${CACHER_URL}${mediaItem.url}` }}
      />
      {isVideo && (
        <PlayCircleOutlined
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 32,
            color: 'white',
            opacity: 0.85,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

// 媒体单个组件
const MediaItem = ({ item, height = '100%', className = '' }: { item: any; height?: string | number, className?: string }) => {
  const isVideo = item.type === 'video' || item.type === 'animated_gif';
  return (
    <div style={{ position: 'relative', width: '100%', height: height, overflow: 'hidden' }} className={className}>
      <Image
        src={`${CACHER_URL}${isVideo ? (item.preview_image_url || item.url) : item.url}`}
        alt={item.alt_text || 'media'}
        width={'100%'}
        height={'100%'}
        style={{ objectFit: 'cover', display: 'block' }}
        preview={{ src: `${CACHER_URL}${item.url}` }}
      />
      {isVideo && (
        <PlayCircleOutlined style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 40,
          color: 'white',
          opacity: 0.85,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
        }} />
      )}
    </div>
  );
};

// 媒体网格组件
const MediaGrid: React.FC<{ media: any[], isList?: boolean }> = ({ media, isList }) => {
  if (isList) {
    return (
      <>
        {media.length > 0 && (
          <Image.PreviewGroup>
            <Space wrap>
              {media.map((mediaItem: any) => (
                <MediaBox key={mediaItem.id} mediaItem={mediaItem} />
              ))}
            </Space>
          </Image.PreviewGroup>
        )}
      </>
    )
  }
  if (!media || media.length === 0) return null;
  const count = media.length;
  const containerStyle: React.CSSProperties = {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    display: 'grid',
    gap: '2px',
  };
  let gridStyle: React.CSSProperties = {};
  if (count === 1) {
    return (
      <div style={{ ...containerStyle, maxHeight: 510, minHeight: 120 }}>
         <MediaItem item={media[0]} height="auto" />
      </div>
    );
  } else if (count === 2) {
    gridStyle = {
      gridTemplateColumns: '1fr 1fr',
      aspectRatio: '16 / 9'
    };
  } else if (count === 3) {
    gridStyle = {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      aspectRatio: '16 / 9'
    };
  } else if (count >= 4) {
    gridStyle = {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      aspectRatio: '16 / 9'
    };
  }
  return (
    <Image.PreviewGroup>
      <div style={{ ...containerStyle, ...gridStyle }}>
        {media.slice(0, 4).map((item, index) => {
          let itemStyle: React.CSSProperties = {};
          if (count === 3 && index === 0) {
            itemStyle = { gridRow: 'span 2' };
          }
          return (
            <div key={item.id} style={{ ...itemStyle }}>
              <MediaItem item={item} />
            </div>
          );
        })}
      </div>
    </Image.PreviewGroup>
  );
};

// 推文卡片组件
const TweetCard: React.FC<{ tweet: any, isQuoted?: boolean, isList?: boolean }> = ({ tweet, isQuoted = false, isList = false }) => {
  if (!tweet || !tweet.author) return null;
  const author = tweet.author;
  const media = tweet.content?.entities?.media || [];
  const quotedTweet = tweet.content?.quote;
  const tweetUrl = `https://x.com/${author.username}/status/${tweet.id}`;
  const avatarUrl = `${CACHER_URL}${author.avatar}`;
  const cardSize = isQuoted ? 'small' : 'default';
  const avatarSize = isQuoted ? 'small' : 'large';
  const spaceSize = isQuoted ? 'small' : undefined;
  const cardStyle = isQuoted ? { root: { marginTop: '12px' } } : { body: { padding: '12px 16px' } };
  // 提取通用内容
  const content = (
    <>
      {/* 作者信息 */}
      <Space align="center" size={spaceSize}>
        {isQuoted && (
          <Avatar src={avatarUrl} size={avatarSize} />
        )}
        <Tooltip title={<UserTooltip author={author} />}>
          <Text strong>@{author.username}</Text>
        </Tooltip>
        <Text type="secondary">·</Text>
        {isList ? (
          <Tooltip title={dayjs(tweet.timestamp).format('YYYY-MM-DD HH:mm:ss')}>
            <Link href={tweetUrl} target="_blank" rel="noopener noreferrer" type="secondary">
              {dayjs(tweet.timestamp).fromNow()}
            </Link>
          </Tooltip>
        ) : (
          <Tooltip title={`${dayjs(tweet.timestamp).fromNow()} ${dayjs(tweet.timestamp).format('YYYY-MM-DD HH:mm:ss')}`}>
            <Link href={tweetUrl} target="_blank" rel="noopener noreferrer" type="secondary">
              {dayjs(tweet.timestamp).format('YYYY-MM-DD')}
            </Link>
          </Tooltip>
        )}
      </Space>
      {/* 推文文本 */}
      <Paragraph style={{ margin: '8px 0' }}>
        {parseTweetText(tweet)}
      </Paragraph>
      {/* 媒体内容 */}
      <MediaGrid media={media} isList={isList} />
    </>
  );

  return (
    <Card size={cardSize} styles={cardStyle}>
      {isQuoted ? (
        // 引用推文
        <>
          {content}
        </>
      ) : (
        // 主推文
        <>
          <Space align='start'>
            <Avatar src={avatarUrl} size={avatarSize} />
            <div style={{ flex: 1 }}>
              {content}
              {/* 引用推文 */}
              {quotedTweet && (
                <TweetCard tweet={quotedTweet} isQuoted isList={isList} />
              )}
            </div>
          </Space>
        </>
      )}
    </Card>
  );
};

export default TweetCard;
