// lib/cleaner.ts
import { ITweet } from '@/models/Tweet';
import { IUser } from '@/models/User';
import { IMedia } from '@/models/Media';

/**
 * 清洗单个 Media 对象
 * @param rawMedia 原始媒体对象 (any 类型)
 */
const cleanMedia = (rawMedia: any): IMedia => {
  return {
    id: rawMedia.media_key,
    type: rawMedia.type,
    url: rawMedia.url || rawMedia.preview_image_url || '',
    duration_ms: rawMedia.duration_ms,
    alt_text: rawMedia.alt_text,
    height: rawMedia.height,
    width: rawMedia.width,
  } as IMedia;
};

/**
 * 清洗单个 User 对象
 * @param rawUser 原始用户对象 (any 类型)
 */
const cleanUser = (rawUser: any): IUser => {
  return {
    id: rawUser.id,
    timestamp: new Date(rawUser.created_at).getTime(),
    username: rawUser.username,
    name: rawUser.name,
    description: rawUser.description,
    avatar: rawUser.profile_image_url,
    url: rawUser.url,
  } as IUser;
};

/**
 * 清洗单个 Tweet 对象
 * @param rawTweet 原始推文对象 (any 类型)
 * @param isPrimary 是否为主推文
 */
const cleanTweet = (rawTweet: any, isPrimary: boolean): ITweet => {
  const cleanEntities: any = {};

  if (rawTweet.entities?.urls) {
    cleanEntities.urls = rawTweet.entities.urls.map((url: any) => ({
      text: url.display_url,
      anchor: url.url,
      url: url.expanded_url,
      media_key: url.media_key,
      start: url.start,
      end: url.end,
    }));
  }

  if (rawTweet.entities?.hashtags) {
    cleanEntities.hashtags = rawTweet.entities.hashtags.map((tag: any) => ({
      text: tag.tag,
      start: tag.start,
      end: tag.end,
    }));
  }

  if (rawTweet.entities?.mentions) {
    cleanEntities.mentions = rawTweet.entities.mentions.map((mention: any) => ({
      id: mention.id,
      username: mention.username,
      start: mention.start,
      end: mention.end,
    }));
  }

  return {
    id: rawTweet.id,
    timestamp: new Date(rawTweet.created_at).getTime(),
    isPrimary,
    author: rawTweet.author_id,
    content: {
      text: rawTweet.text,
      entities: cleanEntities,
      quote: rawTweet.referenced_tweets?.find((ref: any) => ref.type === 'quoted')?.id,
    },
  } as ITweet;
};

/**
 * v2 格式数据清洗器主函数
 * @param rawData 原始 v2 格式的 JSON 对象 (any 类型)
 * @returns 清洗后的、符合新数据模型的数据
 */
export const cleanV2Data = (rawData: any): { tweets: ITweet[], users: IUser[], media: IMedia[] } => {
  const cleanedMedia = rawData.includes?.media?.map(cleanMedia) || [];
  const cleanedUsers = rawData.includes?.users?.map(cleanUser) || [];

  const primaryTweets = rawData.data?.map((tweet: any) => cleanTweet(tweet, true)) || [];
  const referencedTweets = rawData.includes?.tweets?.map((tweet: any) => cleanTweet(tweet, false)) || [];
  
  const tweetMap = new Map<string, ITweet>();
  referencedTweets.forEach((tweet: any) => tweetMap.set(tweet.id, tweet));
  primaryTweets.forEach((tweet: any) => tweetMap.set(tweet.id, tweet));
  const cleanedTweets = Array.from(tweetMap.values());

  return {
    tweets: cleanedTweets,
    users: cleanedUsers,
    media: cleanedMedia,
  };
};

/**
 * 格式检测函数：判断传入的数据是否为 v2 格式
 * @param data 任意 JSON 对象
 * @returns 如果是 v2 格式则返回 true
 */
export const isV2Format = (data: any): boolean => {
  // v2 格式的标志性特征是顶层有 `data` 和 `includes` 字段
  return typeof data === 'object' && data !== null && ('data' in data || 'includes' in data);
};
