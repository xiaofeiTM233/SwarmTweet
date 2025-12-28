// utils/textParser.tsx
import React from 'react';
import reactStringReplace from 'react-string-replace';
import { Typography } from 'antd';
import { ITweet } from '@/models/Tweet';

const { Link } = Typography;

type ParsedText = (string | React.ReactNode)[];

// 文本实体接口定义
interface Entity {
  start: number;
  end: number;
  type: 'url' | 'hashtag' | 'mention';
  data: any;
}

// 简单文本解析函数，用于用户简介等场景
export const parseSimpleTextWithLinks = (text: string): ParsedText => {
  if (!text) return [];
  
  let replacedText: ParsedText = [text];
  
  // URL 正则匹配
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  replacedText = reactStringReplace(replacedText, urlRegex, (match, i) => (
    <Link href={match} target="_blank" rel="noopener noreferrer" key={`simple-url-${i}`}>
      {match}
    </Link>
  ));
  
  return replacedText;
};

// 推文文本解析主函数
export const parseTweetText = (tweet: ITweet): ParsedText => {
  const text = tweet.text;
  const entities: Entity[] = [];

  // 收集所有需要处理的实体
  if (tweet.entities?.urls) {
    tweet.entities.urls.forEach(url => entities.push({ ...url, type: 'url', data: url }));
  }
  if (tweet.entities?.hashtags) {
    tweet.entities.hashtags.forEach(tag => entities.push({ ...tag, type: 'hashtag', data: tag }));
  }
  if (tweet.entities?.mentions) {
    tweet.entities.mentions.forEach(mention => entities.push({ ...mention, type: 'mention', data: mention }));
  }

  // 没有实体则返回原始文本
  if (entities.length === 0) {
    return [text];
  }

  // 按位置排序实体
  const sortedEntities = entities.sort((a, b) => a.start - b.start);

  const result: ParsedText = [];
  let lastIndex = 0;

  const textChars = Array.from(text);

  // 遍历实体并构建渲染结果
  sortedEntities.forEach((entity, index) => {
    // 添加实体前的普通文本
    if (entity.start > lastIndex) {
      result.push(textChars.slice(lastIndex, entity.start).join(''));
    }

    const originalText = textChars.slice(entity.start, entity.end).join('');
    let entityElement: React.ReactNode;

    // 根据实体类型渲染对应组件
    switch (entity.type) {
      case 'url':
        entityElement = <Link href={entity.data.expanded_url} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{entity.data.display_url}</Link>;
        break;
      case 'hashtag':
        entityElement = <Link href={`https://x.com/hashtag/${entity.data.tag}`} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{originalText}</Link>;
        break;
      case 'mention':
        entityElement = <Link href={`https://x.com/${entity.data.username}`} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{originalText}</Link>;
        break;
      default:
        entityElement = originalText;
    }
    
    result.push(entityElement);
    lastIndex = entity.end;
  });

  // 添加剩余文本
  if (lastIndex < textChars.length) {
    result.push(textChars.slice(lastIndex).join(''));
  }

  return result;
};
