// components/textParser.tsx
import React from 'react';
import { Typography } from 'antd';
import { ITweet } from '@/models/Tweet';

const { Link } = Typography;

type ParsedText = (string | React.ReactNode)[];

interface Entity {
  start: number;
  end: number;
  type: 'url' | 'hashtag' | 'mention' | 'media';
  data: any;
}

// 解析简单文本并提取链接
export const parseSimpleTextWithLinks = (text: string | undefined): ParsedText => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => 
      urlRegex.test(part) ? (
          <Link href={part} target="_blank" rel="noopener noreferrer" key={`simple-url-${i}`}>
              {part}
          </Link>
      ) : part
  );
};

// 解析推文文本
export const parseTweetText = (tweet: ITweet): ParsedText => {
  let text = tweet.content.text;
  const tweetEntities = tweet.content.entities;
  const entities: Entity[] = [];

  // 收集所有实体类型
  if (tweetEntities?.urls) tweetEntities.urls.forEach(e => entities.push({ ...e, type: 'url', data: e }));
  if (tweetEntities?.hashtags) tweetEntities.hashtags.forEach(e => entities.push({ ...e, type: 'hashtag', data: e }));
  if (tweetEntities?.mentions) tweetEntities.mentions.forEach(e => entities.push({ ...e, type: 'mention', data: e }));
  if (tweetEntities?.media) tweetEntities.media.forEach(e => entities.push({ ...e, type: 'media', data: e }));

  if (entities.length === 0) return [text];

  // 按 start 索引对所有实体进行排序
  const sortedEntities = entities.sort((a, b) => a.start - b.start);
  const result: ParsedText = [];
  let lastIndex = 0;
  const textChars = Array.from(text);

  sortedEntities.forEach((entity, index) => {
    if (entity.start > lastIndex) {
      result.push(textChars.slice(lastIndex, entity.start).join(''));
    }

    // 获取原始文本
    const originalText = textChars.slice(entity.start, entity.end).join('');

    // 跳过引用推文末尾的 URL 实体
    const isLastEntity = index === sortedEntities.length - 1;
    if (isLastEntity && entity.type === 'url' && tweet.content.quote && entity.end === textChars.length) {
        lastIndex = entity.end;
        return;
    }
    
    let entityElement: React.ReactNode;
    switch (entity.type) {
      case 'url':
        entityElement = <Link href={entity.data.url} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{entity.data.text}</Link>;
        break;
      case 'hashtag':
        entityElement = <Link href={`https://x.com/hashtag/${entity.data.text}`} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{originalText}</Link>;
        break;
      case 'mention':
        entityElement = <Link href={`https://x.com/${entity.data.username}`} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{originalText}</Link>;
        break;
      case 'media':
        // 媒体实体不渲染占位链接
        break;
      default:
        entityElement = originalText;
    }
    // 添加实体元素到结果中
    if (entityElement) {
      result.push(entityElement);
    }
    lastIndex = entity.end;
  });

  // 添加最后一个实体后面的剩余文本
  if (lastIndex < textChars.length) {
    result.push(textChars.slice(lastIndex).join(''));
  }

  return result;
};
