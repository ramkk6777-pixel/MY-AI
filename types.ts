
export enum AppView {
  CHAT = 'chat',
  IMAGE = 'image',
  LIVE = 'live'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}
