export type City = {
  id: string;
  name: string;
  region: string;
  domain: string;
};

export type Alert = {
  id: string;
  content: string;
  createdAt: string;
};

export type News = {
  id: string;
  publisherId: string;
  title: string;
  content: string;
  createdAt: string;
};

export type Post = {
  id: string;
  authorId: string;
  communityId: string;
  content: string;
  createdAt: string;
  author?: {
    name: string;
  };
};

export type Message = {
  id: string;
  content: string;
  timestamp: string;
  authorId: string;
  author?: {
    name: string;
  };
};

export type Chat = {
  id: string;
  messages: Message[];
};

export type Community = {
  id: string;
  name: string;
  description: string;
  cityId: string;
  createdAt: string;
  chats: Chat[];
  posts: Post[];
};
