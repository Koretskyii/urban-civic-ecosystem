export interface City {
    id: string;
    name: string;
    region: string;
    domain: string;
}

export interface Alert {
    id: string;
    content: string;
    createdAt: string;
};

export interface News {
    id: string;
    publisherId: string;
    title: string;
    content: string;
    createdAt: string;
};

export interface Post {
    id: string;
    authorId: string;
    communityId: string;
    content: string;
    createdAt: string;
    author?: {
        name: string;
    };
};

export interface Message {
    id: string;
    content: string;
    timestamp: string;
    authorId: string;
    author?: {
        name: string;
    };
};

export interface Chat {
    id: string;
    messages: Message[];
};

export interface Community {
    id: string;
    name: string;
    description: string;
    cityId: string;
    createdAt: string;
    chats: Chat[];
    posts: Post[];
};

export interface DomainVerificationData {
    domain: string;
    token: string;
}
