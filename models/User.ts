// models/User.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { IUrlEntity } from '@/models/entities';

// 用户数据接口定义
export interface IUser extends Document {
  id: string;
  username: string;
  name: string;
  description: string;
  avatar: string;
  banner?: string;
  url?: string;
  timestamp: number;
  entitie?: {
    urls?: IUrlEntity[];
  };
}

// 用户数据模型 Schema
const UserSchema: Schema<IUser> = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  avatar: { type: String, required: true },
  banner: { type: String },
  url: { type: String },
  timestamp: { type: Number, required: true },
  entitie: {
    _id: false,
    urls: [{
      _id: false,
      start: Number,
      end: Number,
      text: String,
      anchor: String,
      url: String,
    }]
  },
});

const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
