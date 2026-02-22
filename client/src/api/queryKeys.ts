export const queryKeys = {
  auth: {
    register: () => ['auth', 'register'] as const,
    login: () => ['auth', 'login'] as const,
    refresh: () => ['auth', 'refresh'] as const,
    logout: () => ['auth', 'logout'] as const,
    profile: () => ['auth', 'profile'] as const,
  },

  cities: {
    all: () => ['cities'] as const,
    detail: (id: string) => ['cities', id] as const,
  },

  cityRequests: {
    all: (cityId: string) => ['city-requests', cityId] as const,
    detail: (id: string) => ['city-requests', 'detail', id] as const,
  },

  projects: {
    all: (cityId: string) => ['projects', cityId] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },

  communities: {
    all: (cityId: string) => ['communities', cityId] as const,
    detail: (id: string) => ['communities', 'detail', id] as const,
    posts: (communityId: string) =>
      ['communities', communityId, 'posts'] as const,
  },

  surveys: {
    all: (cityId: string) => ['surveys', cityId] as const,
    detail: (id: string) => ['surveys', 'detail', id] as const,
  },

  crowdfunding: {
    all: (cityId: string) => ['crowdfunding', cityId] as const,
    detail: (id: string) => ['crowdfunding', 'detail', id] as const,
  },

  news: {
    all: (cityId: string) => ['news', cityId] as const,
    detail: (id: string) => ['news', 'detail', id] as const,
  },

  alerts: {
    all: (cityId: string) => ['alerts', cityId] as const,
  },

  chats: {
    all: (cityId: string) => ['chats', cityId] as const,
    messages: (chatId: string) => ['chats', chatId, 'messages'] as const,
  },
} as const;
