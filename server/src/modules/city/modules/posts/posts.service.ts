import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) { }

    async getCityPosts(cityId: string) {
        return this.prisma.post.findMany({
            where: {
                community: {
                    cityId,
                },
            },
            select: {
                id: true,
                authorId: true,
                communityId: true,
                content: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}
