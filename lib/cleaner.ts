// lib/cleaner.ts
import { ITweet } from '@/models/Tweet';
import { IUser } from '@/models/User';
import { IMedia } from '@/models/Media';

// === v2 格式清洗逻辑 ===
const cleanV2Media = (rawMedia: any): IMedia => {
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
const cleanV2User = (rawUser: any): IUser => {
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
// 清洗推文数据
const cleanV2Tweet = (rawTweet: any, isPrimary: boolean): ITweet => {
  const cleanEntities: any = {};
  // 链接
  if (rawTweet.entities?.urls) {
    cleanEntities.urls = [];
    cleanEntities.media = [];
    rawTweet.entities.urls.forEach((url: any) => {
      const cleanUrl = {
        start: url.start, end: url.end, text: url.display_url, anchor: url.url,
        url: url.expanded_url, media_key: url.media_key,
      };
      if (url.media_key) {
        cleanEntities.media.push({ ...cleanUrl, id: url.media_key });
      } else {
        cleanEntities.urls.push(cleanUrl);
      }
    });
    if (cleanEntities.urls.length === 0) delete cleanEntities.urls;
    if (cleanEntities.media.length === 0) delete cleanEntities.media;
  }
  // 标签
  if (rawTweet.entities?.hashtags) {
    cleanEntities.hashtags = rawTweet.entities.hashtags.map((tag: any) => ({
      text: tag.tag,
      start: tag.start,
      end: tag.end,
    }));
  }
  // 提及
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
// 清洗 v2 格式数据的主函数
export const cleanV2Data = (rawData: any): { tweets: ITweet[], users: IUser[], media: IMedia[] } => {
  const cleanedMedia = rawData.includes?.media?.map(cleanV2Media) || [];
  const cleanedUsers = rawData.includes?.users?.map(cleanV2User) || [];
  // 清洗主推文和引用推文
  const primaryTweets = rawData.data?.map((tweet: any) => cleanV2Tweet(tweet, true)) || [];
  const queteTweets = rawData.includes?.tweets?.map((tweet: any) => cleanV2Tweet(tweet, false)) || [];
  // 合并推文
  const tweetMap = new Map<string, ITweet>();
  queteTweets.forEach((tweet: any) => tweetMap.set(tweet.id, tweet));
  primaryTweets.forEach((tweet: any) => tweetMap.set(tweet.id, tweet));
  const cleanedTweets = Array.from(tweetMap.values());
  return {
    tweets: cleanedTweets,
    users: cleanedUsers,
    media: cleanedMedia,
  };
};
// 判断是否为 v2 格式
export const isV2Format = (data: any): boolean => {
  return typeof data === 'object' && data !== null && ('data' in data || 'includes' in data) && !data?.data?.search_by_raw_query && !data?.data?.user?.result;
};

// === graphql 共享清洗逻辑 ===
const parseVgDate = (dateString: string): number => {
  if (!dateString) return 0;
  return new Date(dateString).getTime();
};
// 共享清洗逻辑
const cleanVg = (entries: any[]): { tweets: ITweet[], users: IUser[], media: IMedia[] } => {
  const tweets: any[] = [];
  const users: any[] = [];
  const media: any[] = [];

  if (!Array.isArray(entries)) {
    return { tweets: [], users: [], media: [] };
  }
  // 主提取函数
  const traverseTweet = (tweetResult: any, isPrimary: boolean) => {
    if (!tweetResult || !tweetResult.rest_id) return;
    tweets.push({ ...tweetResult, __isPrimary: isPrimary });
    if (tweetResult.core?.user_results?.result) {
      users.push(tweetResult.core.user_results.result);
    }
    if (tweetResult.legacy?.entities?.media) {
      media.push(...tweetResult.legacy.entities.media);
    }
    if (tweetResult.quoted_status_result?.result) {
      traverseTweet(tweetResult.quoted_status_result.result, false);
    }
  };
  for (const entry of entries) {
    if (entry?.content?.itemContent?.tweet_results?.result) {
      traverseTweet(entry?.content?.itemContent?.tweet_results?.result, true);
    }
  }
  // 媒体
  const mediaMap = new Map<string, IMedia>();
  media.forEach(m => {
    if (m.media_key && !mediaMap.has(m.media_key)) {
      mediaMap.set(m.media_key, {
        id: m.media_key, type: m.type, url: m.media_url_https,
        alt_text: m.ext_alt_text, height: m.original_info?.height, width: m.original_info?.width,
      } as IMedia);
    }
  });
  // 用户
  const userMap = new Map<string, IUser>();
  users.forEach(u => {
    if (u.rest_id && !userMap.has(u.rest_id)) {
      userMap.set(u.rest_id, {
        id: u.rest_id, timestamp: parseVgDate(u.core?.created_at), username: u.core?.screen_name,
        name: u.core?.name, description: u.legacy?.description, avatar: u.avatar?.image_url,
        banner: u.legacy?.profile_banner_url, url: u.legacy?.url,
        entitie: {
          urls: u.legacy?.entities?.description?.urls?.map((url: any) => ({
            anchor: url.url, text: url.display_url, url: url.expanded_url,
            start: url.indices?.[0], end: url.indices?.[1],
          })) || [],
        },
      } as IUser);
    }
  });
  // 推文
  const tweetMap = new Map<string, ITweet>();
  tweets.forEach(t => {
    if (t.rest_id && !tweetMap.has(t.rest_id)) {
      const entities = [...(t.legacy?.entities?.media || []), ...(t.legacy?.entities?.urls || [])];
      const quote = t.__isPrimary ? t.quoted_status_result?.result?.rest_id : undefined;
      tweetMap.set(t.rest_id, {
        id: t.rest_id, timestamp: parseVgDate(t.legacy?.created_at), isPrimary: t.__isPrimary,
        author: t.legacy?.user_id_str,
        content: {
          text: t.legacy?.full_text,
          entities: {
            urls: entities.map((e: any) => ({
              anchor: e.url, text: e.display_url, url: e.expanded_url, media_key: e.media_key,
              start: e.indices?.[0], end: e.indices?.[1],
            })),
            hashtags: t.legacy?.entities?.hashtags?.map((e: any) => ({
              text: e.text, start: e.indices?.[0], end: e.indices?.[1],
            })) || [],
            mentions: t.legacy?.entities?.user_mentions?.map((e: any) => ({
              username: e.screen_name, id: e.id_str, start: e.indices?.[0], end: e.indices?.[1],
            })) || [],
          },
          quote,
        },
      } as ITweet);
    }
  });
  return {
    tweets: Array.from(tweetMap.values()),
    users: Array.from(userMap.values()),
    media: Array.from(mediaMap.values()),
  };
};

// === vg 格式清洗逻辑 ===
export const cleanVgData = (rawData: any): { tweets: ITweet[], users: IUser[], media: IMedia[] } => {
  const entries = rawData?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions?.[0]?.entries;
  return cleanVg(entries);
};
// 判断是否为 vg 格式
export const isVgFormat = (data: any): boolean => {
  return typeof data?.data?.search_by_raw_query === 'object';
};

// === vgu 格式清洗逻辑 ===
export const cleanVguData = (rawData: any): { tweets: ITweet[], users: IUser[], media: IMedia[] } => {
  const instructions = rawData?.data?.user?.result?.timeline?.timeline?.instructions;
  const lastInstruction = Array.isArray(instructions) ? instructions[instructions.length - 1] : undefined;
  const entries = lastInstruction?.entries;
  return cleanVg(entries);
};
// 判断是否为 vgu 格式
export const isVguFormat = (data: any): boolean => {
  return typeof data?.data?.user?.result?.timeline === 'object';
};
