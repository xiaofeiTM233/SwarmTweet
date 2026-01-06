// app/api/tweets/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tweet from '@/models/Tweet';
import User from '@/models/User';
import Media from '@/models/Media';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // 构建查询条件
    const query: any = {};
    const isPrimary = searchParams.get('isPrimary');
    if (isPrimary === 'yes' || !isPrimary) {
      query.isPrimary = true;
    } else if (isPrimary === 'no') {
      query.isPrimary = false;
    }

    // 文本搜索
    const searchText = searchParams.get('searchText');
    if (searchText) query['content.text'] = { $regex: searchText, $options: 'i' };

    // 日期范围筛选
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime();
        query.timestamp = { $gte: startTimestamp, $lte: endTimestamp };
    }

    // 作者筛选
    const authorId = searchParams.get('author');
    if (authorId) query.author = authorId;

    // 媒体附件三态筛选
    const hasMedia = searchParams.get('hasMedia');
    if (hasMedia === 'yes') query['content.entities.urls.media_key'] = { $exists: true };
    if (hasMedia === 'no') query['content.entities.urls'] = { $not: { $elemMatch: { media_key: { $exists: true } } } };

    // 转推状态三态筛选
    const hasRetweet = searchParams.get('hasRetweet');
    if (hasRetweet === 'yes') query['content.quote'] = { $exists: true, $ne: null };
    if (hasRetweet === 'no') query['content.quote'] = { $exists: false };

    // 分页参数
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(searchParams.get('pageSize') || '20', 10);
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const pageSize = isNaN(pageSizeParam) || pageSizeParam < 1 ? 20 : pageSizeParam;
    const skip = (page - 1) * pageSize;

    // 总数与分页查询推文
    const total = await Tweet.countDocuments(query);
    const tweets = await Tweet.find(query).sort({ timestamp: -1 }).skip(skip).limit(pageSize).lean();

    // 收集所有需要关联的数据ID
    const authorIds = new Set<string>();
    const quoteTweetIds = new Set<string>();
    const allMediaKeys = new Set<string>();

    tweets.forEach(tweet => {
      authorIds.add(tweet.author);
      if (tweet.content?.quote) {
        quoteTweetIds.add(tweet.content.quote);
      }
      tweet.content?.entities?.urls?.forEach((url: any) => {
        if (url.media_key) {
          allMediaKeys.add(url.media_key);
        }
      });
    });

    // 并行查询关联数据
    const [authors, referencedTweetsRaw, media] = await Promise.all([
      User.find({ id: { $in: Array.from(authorIds) } }).lean(),
      quoteTweetIds.size > 0 ? Tweet.find({ id: { $in: Array.from(quoteTweetIds) } }).lean().then(async (refTweets) => {
          const refAuthorIds = new Set(refTweets.map((t: any) => t.author));
          const refAuthors = await User.find({ id: { $in: Array.from(refAuthorIds) } }).lean();
          const refAuthorMap = new Map(refAuthors.map((a: any) => [a.id, a]));
          return refTweets.map((t: any) => ({ ...t, author: refAuthorMap.get(t.author) }));
      }) : [],
      allMediaKeys.size > 0 ? Media.find({ id: { $in: Array.from(allMediaKeys) } }).lean() : [],
    ]);
    
    // 创建数据映射表用于快速查找
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a]));
    const quoteTweetsMap = new Map((referencedTweetsRaw || []).map((t: any) => [t.id, t]));
    const mediaMap = new Map((media || []).map((m: any) => [m.id, m]));
    
    // 关联数据到推文对象
    const populatedTweets = tweets.map(tweet => {
      const entities: any = { ...tweet.content?.entities, media: [] };
      const urls: any[] = [];

      if (tweet.content?.entities?.urls) {
        tweet.content.entities.urls.forEach((url: any) => {
          if (url.media_key && mediaMap.has(url.media_key)) {
            const mediaInfo = mediaMap.get(url.media_key);
            entities.media.push({
              ...url,
              ...mediaInfo,
            });
          } else {
            urls.push(url);
          }
        });
      }
      
      entities.urls = urls;
      if (entities.media.length === 0) delete entities.media;

      return {
        ...tweet,
        author: authorMap.get(tweet.author),
        content: {
          ...tweet.content,
          entities: entities,
          quote: tweet.content?.quote ? quoteTweetsMap.get(tweet.content.quote) : undefined,
        },
      };
    });
    
    // 获取所有作者用于筛选器
    const allAuthors = await User.find({}).select('id name').lean();
    const hasMore = skip + populatedTweets.length < total;

    return NextResponse.json(
      { success: true, data: { tweets: populatedTweets, authors: allAuthors, total, page, pageSize, hasMore } },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60, max-age=3600' } }
    );
  } catch (error) {
    console.error('Fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
