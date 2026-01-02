// models/Tweet.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { IEntities } from '@/models/entities';

// 推文数据接口定义
export interface ITweet extends Document {
  id: string;
  author: string;
  timestamp: number;
  isPrimary: boolean;
  content: {
    text: string;
    entities?: IEntities; 
    quote?: string;
  };
}

// 推文数据模型 Schema
const TweetSchema: Schema<ITweet> = new Schema({
  id: { type: String, required: true, unique: true },
  author: { type: String, required: true },
  timestamp: { type: Number, required: true },
  isPrimary: { type: Boolean, default: false, index: true },
  content: {
    _id: false,
    text: { type: String, required: true },
    entities: {
      _id: false,
      urls: [{ _id: false, start: Number, end: Number, text: String, anchor: String, url: String, media_key: String }],
      hashtags: [{ _id: false, start: Number, end: Number, text: String }],
      mentions: [{ _id: false, id: String, start: Number, end: Number, username: String }],
    },
    quote: { type: String },
  },
});

const Tweet: Model<ITweet> = models.Tweet || mongoose.model<ITweet>('Tweet', TweetSchema);

export default Tweet;
