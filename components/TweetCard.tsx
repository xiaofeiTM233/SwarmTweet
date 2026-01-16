// components/TweetCard.tsx
import React, { useRef } from 'react';
import { Avatar, Card, Image, Space, Tooltip, Typography, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { IUser } from '@/models/User';
import { parseTweetText, parseSimpleTextWithLinks } from '@/components/textParser';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const CACHER_URL = process.env.NEXT_PUBLIC_CACHER_URL || '';
const { Text, Paragraph, Link } = Typography;

// 用户信息提示框组件
const UserTooltip = ({ author }: { author: IUser }) => {
  const userUrl = `https://x.com/${author.username}`;
  return (
    <Space orientation="vertical" size="small" className="user-tooltip">
      <Link href={userUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="user-tooltip-link">
        <Space align="start">
          <Avatar src={`${CACHER_URL}${author.avatar}`} size="large" className="user-tooltip-avatar" />
          <div>
            <Text strong className="user-tooltip-name" style={{ color: 'white' }}>{author.name}</Text><br />
            <Text type="secondary" className="user-tooltip-username" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>@{author.username}</Text>
          </div>
        </Space>
      </Link>
      <Paragraph className="user-tooltip-desc" style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 300 }}>
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
    <div style={{ position: 'relative', display: 'inline-block' }} key={mediaItem.id} className="media-box">
      <Image
        width={150}
        src={`${CACHER_URL}${isVideo ? (mediaItem.preview_image_url || mediaItem.url) : mediaItem.url}`}
        alt={mediaItem.alt_text || mediaItem.type}
        preview={{ src: `${CACHER_URL}${mediaItem.url}` }}
        className="media-box-image"
      />
      {isVideo && (
        <PlayCircleOutlined
          className="media-box-play"
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
    <div style={{ position: 'relative', width: '100%', height: height, overflow: 'hidden' }} className={`media-item ${className}`}>
      <Image
        src={`${CACHER_URL}${isVideo ? (item.preview_image_url || item.url) : item.url}`}
        alt={item.alt_text || 'media'}
        width={'100%'}
        height={'100%'}
        style={{ objectFit: 'cover', display: 'block' }}
        preview={{ src: `${CACHER_URL}${item.url}` }}
        className="media-item-image"
      />
      {isVideo && (
        <PlayCircleOutlined className="media-item-play" style={{
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
          <Image.PreviewGroup classNames={{ root: 'media-grid-list' }}>
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
      <div style={{ ...containerStyle, maxHeight: 510, minHeight: 120 }} className="media-grid">
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
      <div style={{ ...containerStyle, ...gridStyle }} className="media-grid">
        {media.slice(0, 4).map((item, index) => {
          let itemStyle: React.CSSProperties = {};
          if (count === 3 && index === 0) {
            itemStyle = { gridRow: 'span 2' };
          }
          return (
            <div key={item.id} style={{ ...itemStyle }} className="media-grid-item">
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
  const ref = useRef<HTMLDivElement>(null);
  if (!tweet || !tweet.author) return null;
  const [messageApi, contextHolder] = message.useMessage();
  const author = tweet.author;
  const media = tweet.content?.entities?.media || [];
  const quotedTweet = tweet.content?.quote;
  const tweetUrl = `https://x.com/${author.username}/status/${tweet.id}`;
  const avatarUrl = `${CACHER_URL}${author.avatar}`;
  const cardSize = isQuoted ? 'small' : 'default';
  const avatarSize = isQuoted ? 'small' : 'large';
  const spaceSize = isQuoted ? 'small' : undefined;
  const cardStyle = isQuoted ? { root: { marginTop: '12px' } } : { body: { padding: '12px 16px' } };
  const theRef = isQuoted ? null : ref;
  // 下载处理
  const handleDownload = async () => {
    if (!ref.current) return;
    try {
      messageApi.info('开始生成...');
      const dataUrl = await toPng(ref.current);
      messageApi.success('生成成功，准备下载');
      download(dataUrl, `swarmtweet-${tweet.id}.png`);
    } catch (error) {
      messageApi.error('❌ 生成失败，请查看控制台或稍后重试');
      console.error('❌ 生成失败:', error);
    }
  };
  // 提取通用内容
  const content = (
    <>
      {/* 作者信息 */}
      <Space align="center" size={spaceSize} className="tweet-card-header">
        {isQuoted && (
          <Avatar src={avatarUrl} size={avatarSize} className="tweet-card-avatar" />
        )}
        <Tooltip title={<UserTooltip author={author} />} className="tweet-card-author-tooltip">
          <Text strong className="tweet-card-author">@{author.username}</Text>
        </Tooltip>
        <Text type="secondary" className="tweet-card-sep">·</Text>
        {isList ? (
          <Tooltip title={dayjs(tweet.timestamp).format('YYYY-MM-DD HH:mm:ss')}>
            <Link href={tweetUrl} target="_blank" rel="noopener noreferrer" type="secondary" className="tweet-card-timestamp">
              {dayjs(tweet.timestamp).fromNow()}
            </Link>
          </Tooltip>
        ) : (
          <Tooltip title={<Link onClick={handleDownload} style={{ color: 'inherit' }}>{`${dayjs(tweet.timestamp).fromNow()} ${dayjs(tweet.timestamp).format('YYYY-MM-DD HH:mm:ss')}`}</Link>}>
            <Link href={tweetUrl} target="_blank" rel="noopener noreferrer" type="secondary" className="tweet-card-timestamp">
              {dayjs(tweet.timestamp).format('YYYY-MM-DD')}
            </Link>
          </Tooltip>
        )}
      </Space>
      {/* 推文文本 */}
      <Paragraph style={{ margin: '8px 0' }} className="tweet-card-content">
        {parseTweetText(tweet)}
      </Paragraph>
      {/* 媒体内容 */}
      <div className="tweet-card-media"><MediaGrid media={media} isList={isList} /></div>
    </>
  );

  return (
    <Card ref={theRef} size={cardSize} styles={cardStyle} className={`tweet-card ${isQuoted ? 'tweet-card-quoted' : ''}`}>
      {contextHolder}
      {isQuoted ? (
        // 引用推文
        <>
          {content}
        </>
      ) : (
        // 主推文
        <>
          <Space align='start' className="tweet-card-main">
            <Avatar src={avatarUrl} size={avatarSize} className="tweet-card-avatar" />
            <div style={{ flex: 1 }}>
              {content}
              {/* 引用推文 */}
              {quotedTweet && (
                <div className="tweet-card-quoted-wrap"><TweetCard tweet={quotedTweet} isQuoted isList={isList} /></div>
              )}
            </div>
          </Space>
        </>
      )}
    </Card>
  );
};

export default TweetCard;
