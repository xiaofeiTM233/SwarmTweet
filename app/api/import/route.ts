// app/api/import/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tweet from '@/models/Tweet';
import User from '@/models/User';
import Media from '@/models/Media';
import { cleanV2Data, isV2Format } from '@/lib/cleaner';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // 格式检测和数据清洗
    if (isV2Format(body)) {
      const { tweets, users, media } = cleanV2Data(body);

      // 使用清洗后的数据进行数据库操作
      const userOps = users.map(user => ({
        updateOne: { filter: { id: user.id }, update: { $set: user }, upsert: true },
      }));
      if (userOps.length > 0) await User.bulkWrite(userOps);

      const mediaOps = media.map(m => ({
        updateOne: { filter: { id: m.id }, update: { $set: m }, upsert: true },
      }));
      if (mediaOps.length > 0) await Media.bulkWrite(mediaOps);

      const tweetOps = tweets.map(tweet => ({
        updateOne: { filter: { id: tweet.id }, update: { $set: tweet }, upsert: true },
      }));
      if (tweetOps.length > 0) await Tweet.bulkWrite(tweetOps);

      return NextResponse.json({ success: true, message: `v2 格式数据导入成功！共处理 ${tweets.length} 条推文。` });
    } 
    // else if (isV1Format(body)) { ... } // 未来可以扩展其他格式
    else {
      return NextResponse.json({ success: false, error: '未知的数据格式' }, { status: 400 });
    }

  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
