// models/User.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// 用户数据接口定义
export interface IUser extends Document {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  protected: boolean;
  verified: boolean;
  description: string;
}

// 用户数据模型 Schema
const UserSchema: Schema<IUser> = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  profile_image_url: { type: String },
  protected: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  description: { type: String },
});

const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
