// app/api/tweets/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tweet, { ITweet } from '@/models/Tweet';
import User from '@/models/User';
import Media from '@/models/Media';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    let query: any = {};

    // 构建查询条件：主推文筛选 (默认查询主推文)
    const isPrimary = searchParams.get('isPrimary');
    if (isPrimary === 'yes') {
      query.isPrimary = true;
    } else if (isPrimary === 'no') {
      query.isPrimary = false;
    }

    // 文本搜索
    const searchText = searchParams.get('searchText');
    if (searchText) query.text = { $regex: searchText, $options: 'i' };

    // 日期范围筛选
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) query.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };

    // 作者筛选
    const authorId = searchParams.get('author');
    if (authorId) query.author_id = authorId;

    // 媒体附件三态筛选
    const hasMedia = searchParams.get('hasMedia');
    if (hasMedia === 'yes') {
      query['attachments.media_keys.0'] = { $exists: true };
    } else if (hasMedia === 'no') {
      query['attachments.media_keys'] = { $exists: false };
    }

    // 转推状态三态筛选
    const hasRetweet = searchParams.get('hasRetweet');
    if (hasRetweet === 'yes') {
      query['referenced_tweets.0'] = { $exists: true };
    } else if (hasRetweet === 'no') {
      query['referenced_tweets'] = { $exists: false };
    }

    // 查询推文并按时间倒序排列
    const tweets: ITweet[] = await Tweet.find(query).sort({ created_at: -1 }).lean();

    // 收集所有需要关联的数据ID
    const authorIds = new Set<string>();
    const mediaKeys = new Set<string>();
    const referencedTweetIds = new Set<string>();
    tweets.forEach(tweet => {
      authorIds.add(tweet.author_id);
      tweet.attachments?.media_keys.forEach(key => mediaKeys.add(key));
      tweet.referenced_tweets?.forEach(ref => referencedTweetIds.add(ref.id));
    });
    
    // 并行查询关联数据
    const [authors, media, referencedTweetsRaw] = await Promise.all([
      User.find({ id: { $in: Array.from(authorIds) } }).lean(),
      Media.find({ media_key: { $in: Array.from(mediaKeys) } }).lean(),
      Tweet.find({ id: { $in: Array.from(referencedTweetIds) } }).lean().then(async (refTweets) => {
        const refAuthorIds = new Set(refTweets.map(t => t.author_id));
        const refAuthors = await User.find({ id: { $in: Array.from(refAuthorIds) } }).lean();
        const refAuthorMap = new Map(refAuthors.map(a => [a.id, a]));
        return refTweets.map(t => ({ ...t, author_id: refAuthorMap.get(t.author_id) }));
      })
    ]);

    // 创建数据映射表用于快速查找
    const authorMap = new Map(authors.map(a => [a.id, a]));
    const mediaMap = new Map(media.map(m => [m.media_key, m]));
    const referencedTweetsMap = new Map(referencedTweetsRaw.map(t => [t.id, t]));

    // 关联数据到推文对象
    const populatedTweets = tweets.map(tweet => ({
      ...tweet,
      author_id: authorMap.get(tweet.author_id),
      attachments: tweet.attachments ? { media_keys: tweet.attachments.media_keys.map(key => mediaMap.get(key)).filter(Boolean) } : undefined,
      referenced_tweets: tweet.referenced_tweets ? tweet.referenced_tweets.map(ref => ({...ref, id: referencedTweetsMap.get(ref.id) })).filter(ref => ref.id) : undefined,
    }));

    // 获取所有作者用于筛选器
    const allAuthors = await User.find({}).select('id name').lean();

    return NextResponse.json({ success: true, data: { tweets: populatedTweets, authors: allAuthors } });
  } catch (error) {
    console.error('Fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
