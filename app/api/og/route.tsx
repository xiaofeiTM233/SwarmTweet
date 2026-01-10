// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import dbConnect from '@/lib/db';
import Tweet from '@/models/Tweet';
import User from '@/models/User';
import Media from '@/models/Media';

export const runtime = 'nodejs';

// ==========================================
// 0. 工具：图片地址清洗与兜底 (修复报错的关键)
// ==========================================
const CACHER_URL = process.env.NEXT_PUBLIC_CACHER_URL || '';

function src(url: string) {
  return `${CACHER_URL}${url}`;
}

// ==========================================
// 1. 字体加载
// ==========================================
let fontBuffer: ArrayBuffer | null = null;
async function getFontData() {
  if (fontBuffer) return fontBuffer;
  const fontPath = path.resolve(process.cwd(), 'fonts', 'AlibabaPuHuiTi-3-65-Medium.ttf');
  try {
    const buffer = await fs.readFile(fontPath);
    fontBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    return fontBuffer;
  } catch (e) {
    return null;
  }
}

// ==========================================
// 2. 文本高亮组件
// ==========================================
const EntityText = ({ text, entities }: { text: string; entities?: any }) => {
  if (!text) return null; // 防止 text 为空报错
  if (!entities) return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;

  const ranges: Array<{ start: number; end: number; type: string; display_url?: string }> = [];
  entities.hashtags?.forEach((t: any) => ranges.push({ ...t, type: 'hashtag' }));
  entities.mentions?.forEach((t: any) => ranges.push({ ...t, type: 'mention' }));
  entities.urls?.forEach((t: any) => ranges.push({ ...t, type: 'url' }));

  ranges.sort((a, b) => a.start - b.start);

  const elements = [];
  let lastIndex = 0;

  ranges.forEach((range, i) => {
    if (range.start > lastIndex) {
      elements.push(<span key={`txt-${i}`}>{text.slice(lastIndex, range.start)}</span>);
    }
    const rawContent = text.slice(range.start, range.end);
    const highlightStyle = { color: '#1d9bf0', marginLeft: 2, marginRight: 2 };

    if (range.type === 'url') {
      elements.push(<span key={`ent-${i}`} style={highlightStyle}>{range.display_url || rawContent}</span>);
    } else {
      elements.push(<span key={`ent-${i}`} style={highlightStyle}>{rawContent}</span>);
    }
    lastIndex = range.end;
  });

  if (lastIndex < text.length) {
    elements.push(<span key="txt-end">{text.slice(lastIndex)}</span>);
  }

  return <span style={{ display: 'flex', flexWrap: 'wrap', whiteSpace: 'pre-wrap' }}>{elements}</span>;
};

// ==========================================
// 3. 媒体组件 (增加空值过滤)
// ==========================================
const MediaGrid = ({ media }: { media: any[] }) => {
  // 过滤掉无效图片的项
  const validMedia = (media || []).filter(m => m && m.url && m.url.startsWith('http'));
  
  if (validMedia.length === 0) return null;
  const list = validMedia.slice(0, 4);
  const radius = '12px';
  const border = '1px solid #cfd9de';

  return (
    <div style={{ display: 'flex', width: '100%', height: '280px', marginTop: '12px', borderRadius: radius, overflow: 'hidden', border }}>
      {list.length === 1 && <img src={src(list[0].url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      {list.length === 2 && (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          <img src={src(list[0].url)} style={{ width: '49.5%', height: '100%', objectFit: 'cover', marginRight: '1%' }} />
          <img src={src(list[1].url)} style={{ width: '49.5%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      {list.length === 3 && (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          <img src={src(list[0].url)} style={{ width: '49.5%', height: '100%', objectFit: 'cover', marginRight: '1%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', width: '49.5%', height: '100%' }}>
            <img src={src(list[1].url)} style={{ width: '100%', height: '49%', objectFit: 'cover', marginBottom: '2%' }} />
            <img src={src(list[2].url)} style={{ width: '100%', height: '49%', objectFit: 'cover' }} />
          </div>
        </div>
      )}
      {list.length === 4 && (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '49.5%', height: '100%', marginRight: '1%' }}>
            <img src={src(list[0].url)} style={{ width: '100%', height: '49%', objectFit: 'cover', marginBottom: '2%' }} />
            <img src={src(list[1].url)} style={{ width: '100%', height: '49%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '49.5%', height: '100%' }}>
            <img src={src(list[2].url)} style={{ width: '100%', height: '49%', objectFit: 'cover', marginBottom: '2%' }} />
            <img src={src(list[3].url)} style={{ width: '100%', height: '49%', objectFit: 'cover' }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. 主逻辑
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const tweetId = searchParams.get('id');
    const tz = parseInt(searchParams.get('tz') || '8', 10);

    if (!tweetId) return new Response('Missing id', { status: 400 });

    const mainTweet = await Tweet.findOne({ id: tweetId }).lean();
    if (!mainTweet) return new Response('Tweet not found', { status: 404 });

    const authorIds = new Set<string>([mainTweet.author]);
    const mediaIds = new Set<string>();
    const quoteIds = new Set<string>();

    if (mainTweet.content?.quote) quoteIds.add(mainTweet.content.quote);
    mainTweet.content?.entities?.urls?.forEach((u: any) => u.media_key && mediaIds.add(u.media_key));

    let quoteTweetRaw: any = null;
    if (quoteIds.size > 0) {
      quoteTweetRaw = await Tweet.findOne({ id: { $in: Array.from(quoteIds) } }).lean();
      if (quoteTweetRaw) {
        authorIds.add(quoteTweetRaw.author);
        quoteTweetRaw.content?.entities?.urls?.forEach((u: any) => u.media_key && mediaIds.add(u.media_key));
      }
    }

    const [authors, medias] = await Promise.all([
      User.find({ id: { $in: Array.from(authorIds) } }).lean(),
      mediaIds.size > 0 ? Media.find({ id: { $in: Array.from(mediaIds) } }).lean() : [],
    ]);

    const authorMap = new Map(authors.map((a: any) => [a.id, a]));
    const mediaMap = new Map(medias.map((m: any) => [m.id, m]));

    // 处理数据
    const processTweetData = (tweet: any) => {
      const entities = { ...tweet.content?.entities, media: [] as any[] };
      const displayUrls: any[] = [];
      const hiddenUrlStrings = new Set<string>();

      tweet.content?.entities?.urls?.forEach((url: any) => {
        if (url.media_key && mediaMap.has(url.media_key)) {
          entities.media.push({ ...url, ...mediaMap.get(url.media_key) });
          hiddenUrlStrings.add(url.url); 
        } else {
          displayUrls.push(url);
        }
      });
      entities.urls = displayUrls;

      let cleanText = tweet.content?.text || '';
      hiddenUrlStrings.forEach((u) => {
        cleanText = cleanText.replace(u, '');
      });

      const author = authorMap.get(tweet.author) || { name: 'Unknown', username: 'unknown' };

      return {
        ...tweet,
        author: { ...author, avatar: author.avatar },
        content: { ...tweet.content, text: cleanText.trim(), entities },
      };
    };

    const tweetData = processTweetData(mainTweet);
    if (quoteTweetRaw) {
      tweetData.content.quote = processTweetData(quoteTweetRaw);
    }

    // 时间处理
    const dateObj = new Date(tweetData.timestamp);
    const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + (3600000 * tz));
    const timeStr = targetTime.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateStr = targetTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    const footerText = `${timeStr} · ${dateStr} · Twitter Card Generator`;

    const fontData = await getFontData();
    const fontConfig = fontData 
      ? [{ name: 'AlibabaPuHuiTi', data: fontData, style: 'normal' as const }]
      : undefined;

    return new ImageResponse(
      (
        <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', fontFamily: '"AlibabaPuHuiTi", sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '600px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
            
            {/* User Info */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px' }}>
              {/* ⚠️ 这里的 src 现在是安全的绝对路径了 */}
              <img src={src(tweetData.author.avatar)} width="64" height="64" style={{ borderRadius: '50%', marginRight: '16px', border: '1px solid #eee' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f1419' }}>{tweetData.author.name}</span>
                <span style={{ fontSize: '16px', color: '#536471', marginTop: '2px' }}>@{tweetData.author.username}</span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex' }}>
                 <svg viewBox="0 0 24 24" width="28" height="28" fill="#1d9bf0"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.592 1.25-3.598 1.995-5.765 1.995-.375 0-.745-.022-1.11-.065 2.06 1.32 4.51 2.09 7.14 2.09 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></svg>
              </div>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', fontSize: '22px', lineHeight: '1.5', color: '#0f1419', marginBottom: '12px', flexWrap: 'wrap' }}>
              <EntityText text={tweetData.content.text} entities={tweetData.content.entities} />
            </div>

            {/* Media */}
            <MediaGrid media={tweetData.content.entities.media} />

            {/* Quote Tweet */}
            {tweetData.content.quote && (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #cfd9de', borderRadius: '12px', padding: '16px', marginTop: '16px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <img src={src(tweetData.content.quote.author.avatar)} width="24" height="24" style={{ borderRadius: '50%', marginRight: '8px' }} />
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f1419', marginRight: '4px' }}>{tweetData.content.quote.author.name}</span>
                  <span style={{ fontSize: '15px', color: '#536471' }}>@{tweetData.content.quote.author.username}</span>
                </div>
                <div style={{ display: 'flex', fontSize: '16px', lineHeight: '1.4', color: '#0f1419', flexWrap: 'wrap' }}>
                  <EntityText text={tweetData.content.quote.content.text} entities={tweetData.content.quote.content.entities} />
                </div>
                <MediaGrid media={tweetData.content.quote.content.entities.media} />
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eff3f4', fontSize: '15px', color: '#536471' }}>
              {footerText}
            </div>
          </div>
        </div>
      ),
      { width: 800, height: undefined, fonts: fontConfig }
    );
  } catch (e: any) {
    console.error('API Error:', e);
    return new ImageResponse(
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: 'white', color: 'red', fontSize: 24 }}>
        Error: {e.message || 'Unknown error'}
      </div>, 
      { width: 600, height: 200 }
    );
  }
}