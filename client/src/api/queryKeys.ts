export const queryKeys = {
  // Auth
  auth: {
    register: () => ['auth', 'register'] as const,
    login: () => ['auth', 'login'] as const,
    refresh: () => ['auth', 'refresh'] as const,
    logout: () => ['auth', 'logout'] as const,
    profile: () => ['auth', 'profile'] as const,
  },

  // Cities
  cities: {
    all: () => ['cities'] as const,
    detail: (id: string) => ['cities', id] as const,
  },

  // City Requests
  cityRequests: {
    all: (cityId: string) => ['city-requests', cityId] as const,
    detail: (id: string) => ['city-requests', 'detail', id] as const,
  },

  // Projects
  projects: {
    all: (cityId: string) => ['projects', cityId] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },

  // Communities
  communities: {
    all: (cityId: string) => ['communities', cityId] as const,
    detail: (id: string) => ['communities', 'detail', id] as const,
    posts: (communityId: string) =>
      ['communities', communityId, 'posts'] as const,
  },

  // Surveys
  surveys: {
    all: (cityId: string) => ['surveys', cityId] as const,
    detail: (id: string) => ['surveys', 'detail', id] as const,
  },

  // Crowdfunding
  crowdfunding: {
    all: (cityId: string) => ['crowdfunding', cityId] as const,
    detail: (id: string) => ['crowdfunding', 'detail', id] as const,
  },

  // News
  news: {
    all: (cityId: string) => ['news', cityId] as const,
    detail: (id: string) => ['news', 'detail', id] as const,
  },

  // Alerts
  alerts: {
    all: (cityId: string) => ['alerts', cityId] as const,
  },

  // Chats
  chats: {
    all: (cityId: string) => ['chats', cityId] as const,
    messages: (chatId: string) => ['chats', chatId, 'messages'] as const,
  },
} as const;
