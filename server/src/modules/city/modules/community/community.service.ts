import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async getCityCommunity(cityId: string) {
    const community = await this.prisma.community.findFirst({
      where: { cityId },
      include: {
        chats: {
          where: { contextType: 'community' },
          include: {
            messages: {
              orderBy: { timestamp: 'asc' },
              include: {
                author: {
                  select: { name: true },
                },
              },
            },
          },
        },
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { name: true },
            },
          },
        },
      },
    });

    return community;
  }
}
