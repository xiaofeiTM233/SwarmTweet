// app/api/import/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tweet from '@/models/Tweet';
import User from '@/models/User';
import Media from '@/models/Media';
import { cleanV2Data, isV2Format, cleanVgData, isVgFormat, cleanVguData, isVguFormat } from '@/lib/cleaner';

export async function POST(request: Request) {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    console.error('❌ API_KEY 环境变量未定义');
    throw new Error(
      '请在 .env 文件中定义 API_KEY 环境变量'
    );
  }
  if (!request.headers.get('x-key') || request.headers.get('x-key') !== API_KEY) {
    return NextResponse.json({ success: false, message: '无效的 API 密钥' }, { status: 403 });
  }
  try {
    await dbConnect();
    const body = await request.json();

    let cleanData;
    let formatName = '未知';
    // 格式检测和数据清洗调度
    if (isVguFormat(body)) {
      formatName = 'vgu';
      cleanData = cleanVguData(body);
    } else if (isVgFormat(body)) {
      formatName = 'vg';
      cleanData = cleanVgData(body);
    } else if (isV2Format(body)) {
      formatName = 'v2';
      cleanData = cleanV2Data(body);
    } else {
      return NextResponse.json({ success: false, error: '未知的数据格式，无法导入' }, { status: 400 });
    }

    // 解构清洗后的数据
    const { tweets, users, media } = cleanData;

    // 计算总条数
    const totalTweets = tweets.length;
    let newTweets = 0;

    // 统一的数据库写入操作
    if (users.length > 0) {
      const userOps = users.map(user => ({
        updateOne: { filter: { id: user.id }, update: { $set: user }, upsert: true },
      }));
      await User.bulkWrite(userOps);
    }
    if (media.length > 0) {
      const mediaOps = media.map(m => ({
        updateOne: { filter: { id: m.id }, update: { $set: m }, upsert: true },
      }));
      await Media.bulkWrite(mediaOps);
    }
    if (tweets.length > 0) {
      const tweetOps = tweets.map(tweet => ({
        updateOne: { filter: { id: tweet.id }, update: { $set: tweet }, upsert: true },
      }));
      const tweetResult = await Tweet.bulkWrite(tweetOps, { ordered: false });
      newTweets = (tweetResult as any).upsertedCount ?? 0;
    }

    return NextResponse.json({ success: true, message: `${formatName} 格式数据导入成功！`, data: { totalTweets, newTweets } });
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
