// app/api/import/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tweet from '@/models/Tweet';
import User from '@/models/User';
import Media from '@/models/Media';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { data, includes } = body;

    // 批量导入用户数据
    if (includes?.users) {
      const userOps = includes.users.map((user: any) => ({
        updateOne: { filter: { id: user.id }, update: { $set: user }, upsert: true },
      }));
      if (userOps.length > 0) await User.bulkWrite(userOps);
    }
    
    // 批量导入媒体数据
    if (includes?.media) {
      const mediaOps = includes.media.map((media: any) => ({
        updateOne: { filter: { media_key: media.media_key }, update: { $set: media }, upsert: true },
      }));
      if (mediaOps.length > 0) await Media.bulkWrite(mediaOps);
    }

    // 区分主推文和引用推文
    const primaryTweets = (data || []).map((tweet: any) => ({ ...tweet, isPrimary: true }));
    const referencedTweets = (includes?.tweets || []).map((tweet: any) => ({ ...tweet, isPrimary: false }));
    const allTweets = [...primaryTweets, ...referencedTweets];

    // 批量导入推文数据
    if (allTweets.length > 0) {
        const tweetOps = allTweets.map((tweet: any) => ({
            updateOne: { filter: { id: tweet.id }, update: { $set: tweet }, upsert: true },
        }));
        await Tweet.bulkWrite(tweetOps);
    }
    
    return NextResponse.json({ success: true, message: '数据导入成功' });
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
