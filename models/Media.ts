// models/Media.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// 媒体文件接口定义
export interface IMedia extends Document {
  id: string;
  type: string;
  url: string;
  alt_text?: string;
  duration_ms?: number;
  height?: number;
  width?: number;
}

// 媒体文件数据模型 Schema
const MediaSchema: Schema<IMedia> = new Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  url: { type: String, required: true },
  alt_text: { type: String },
  duration_ms: { type: Number },
  height: { type: Number },
  width: { type: Number },
});

const Media: Model<IMedia> = models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
