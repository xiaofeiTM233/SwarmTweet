// models/Media.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// 媒体文件接口定义
export interface IMedia extends Document {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  width: number;
  height: number;
}

// 媒体文件数据模型 Schema
const MediaSchema: Schema<IMedia> = new Schema({
  media_key: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['photo', 'video', 'animated_gif'] },
  url: { type: String },
  preview_image_url: { type: String },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
});

const Media: Model<IMedia> = models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
