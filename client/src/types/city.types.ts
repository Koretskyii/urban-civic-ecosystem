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
}

export type News = {
    id: string;
    publisherId: string;
    title: string;
    content: string;
    createdAt: string;
}

export type Post = {
    id: string;
    authorId: string;
    communityId: string;
    content: string;
    createdAt: string;
}