// models/Tweet.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// 文本实体接口定义
interface IUrlEntity { start: number; end: number; url: string; expanded_url: string; display_url: string; }
interface IHashtagEntity { start: number; end: number; tag: string; }
interface IMentionEntity { start: number; end: number; username: string; id: string; }

// 推文接口定义
export interface ITweet extends Document {
  id: string;
  text: string;
  author_id: string;
  created_at: Date;
  conversation_id: string;
  lang: string;
  possibly_sensitive: boolean;
  reply_settings: string;
  isPrimary: boolean;
  entities?: {
    urls?: IUrlEntity[];
    hashtags?: IHashtagEntity[];
    mentions?: IMentionEntity[];
    annotations?: any[];
  };
  attachments?: { media_keys: string[]; };
  referenced_tweets?: { type: 'quoted' | 'replied_to'; id: string; }[];
}

// 推文数据模型 Schema
const TweetSchema: Schema<ITweet> = new Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  author_id: { type: String, required: true },
  created_at: { type: Date, required: true },
  conversation_id: { type: String },
  lang: { type: String },
  possibly_sensitive: { type: Boolean },
  reply_settings: { type: String },
  isPrimary: { type: Boolean, default: false, index: true },
  entities: {
    _id: false,
    urls: [{ _id: false, start: Number, end: Number, url: String, expanded_url: String, display_url: String }],
    hashtags: [{ _id: false, start: Number, end: Number, tag: String }],
    mentions: [{ _id: false, start: Number, end: Number, username: String, id: String }],
    annotations: [Schema.Types.Mixed],
  },
  attachments: { _id: false, media_keys: [{ type: String }] },
  referenced_tweets: [{
    _id: false,
    type: { type: String, enum: ['quoted', 'replied_to'] },
    id: { type: String },
  }],
});

const Tweet: Model<ITweet> = models.Tweet || mongoose.model<ITweet>('Tweet', TweetSchema);

export default Tweet;
