import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}
  async getCityNews(cityId: string) {
    return this.prisma.generalNews.findMany({
      where: {
        cityId,
      },
      select: {
        id: true,
        publisherId: true,
        title: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
