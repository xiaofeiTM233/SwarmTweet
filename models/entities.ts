// models/entities.ts

// 链接实体
export interface IUrlEntity {
  text: string;
  anchor: string; 
  url: string;
  media_key?: string;
  start: number;
  end: number;
}

// 话题实体
export interface IHashtagEntity {
  text: string;
  start: number;
  end: number;
}

// 提及实体
export interface IMentionEntity {
  id: string;
  username: string;
  start: number;
  end: number;
}

// 媒体实体
export interface IMediaEntity extends IUrlEntity {
  id: string;
  type: string;
  height?: number;
  width?: number;
  duration_ms?: number;
  alt_text?: string;
  url: string;
}

// 统一的实体集合接口
export interface IEntities {
  urls: IUrlEntity[];
  hashtags: IHashtagEntity[];
  mentions: IMentionEntity[];
  media: IMediaEntity[];
}
