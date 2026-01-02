// components/textParser.tsx
import React from 'react';
import { Typography } from 'antd';

const { Link } = Typography;

type ParsedText = (string | React.ReactNode)[];

interface Entity {
  start: number;
  end: number;
  type: 'url' | 'hashtag' | 'mention' | 'media';
  data: any;
}

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

export const parseTweetText = (tweet: any): ParsedText => {
  const text = tweet.content.text;
  const entities: Entity[] = [];

  const tweetEntities = tweet.content.entities;
  if (tweetEntities?.urls) tweetEntities.urls.forEach((e: any) => entities.push({ ...e, type: 'url', data: e }));
  if (tweetEntities?.hashtags) tweetEntities.hashtags.forEach((e: any) => entities.push({ ...e, type: 'hashtag', data: e }));
  if (tweetEntities?.mentions) tweetEntities.mentions.forEach((e: any) => entities.push({ ...e, type: 'mention', data: e }));
  if (tweetEntities?.media) tweetEntities.media.forEach((e: any) => entities.push({ ...e, type: 'media', data: e }));

  if (entities.length === 0) return [text];

  const sortedEntities = entities.sort((a, b) => a.start - b.start);
  const result: ParsedText = [];
  let lastIndex = 0;
  const textChars = Array.from(text);

  sortedEntities.forEach((entity, index) => {
    if (entity.start > lastIndex) {
      result.push(textChars.slice(lastIndex, entity.start).join(''));
    }

    const originalText = textChars.slice(entity.start, entity.end).join('');
    let entityElement: React.ReactNode;

    switch (entity.type) {
      case 'url':
      case 'media':
        entityElement = <Link href={entity.data.url} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{entity.data.text}</Link>;
        break;
      case 'hashtag':
        entityElement = <Link href={`https://x.com/hashtag/${entity.data.text}`} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{originalText}</Link>;
        break;
      case 'mention':
        entityElement = <Link href={`https://x.com/${entity.data.name}`} target="_blank" rel="noopener noreferrer" key={`entity-${index}`}>{originalText}</Link>;
        break;
      default:
        entityElement = originalText;
    }
    
    result.push(entityElement);
    lastIndex = entity.end;
  });

  if (lastIndex < textChars.length) {
    result.push(textChars.slice(lastIndex).join(''));
  }
  
  const lastEntity = sortedEntities[sortedEntities.length - 1];
  if (lastEntity && (lastEntity.type === 'media' || (lastEntity.type === 'url' && tweet.content.quote)) && lastEntity.end === textChars.length) {
      const lastResultItem = result[result.length - 1];
      if (React.isValidElement(lastResultItem) && lastResultItem.key === `entity-${sortedEntities.length - 1}`) {
        result.pop();
      }
  }

  return result;
};
