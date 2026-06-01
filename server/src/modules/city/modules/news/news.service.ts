import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateNewsDto, GetNewsQueryDto, UpdateNewsDto } from './dto';
import { RbacService } from '@/modules/rbac/rbac.service';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import { DOMAIN_EVENT_TYPES } from '@/modules/notifications/domain/domain-events';
import { buildNewsEventPayload } from '@/modules/notifications/domain/domain-event.factory';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async createCityNews(cityId: string, userId: string, dto: CreateNewsDto) {
    await this.ensureCityMembership(cityId, userId);

    return this.prisma.$transaction(async (tx) => {
      const news = await tx.generalNews.create({
        data: {
          cityId,
          publisherId: userId,
          title: dto.title.trim(),
          content: dto.content.trim(),
        },
        select: {
          id: true,
          publisherId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'news',
          aggregateId: news.id,
          eventType: DOMAIN_EVENT_TYPES.NEWS_CREATED,
          payload: buildNewsEventPayload({
            cityId,
            newsId: news.id,
            publisherId: userId,
            title: news.title,
          }),
        },
      });
      return news;
    });
  }

  async getCityNews(cityId: string, userId: string, query: GetNewsQueryDto) {
    await this.ensureCityMembership(cityId, userId);
    const canManageNews = await this.canManageNews(cityId, userId);

    const includeDeleted = query.includeDeleted === true;
    if (includeDeleted && !canManageNews) {
      throw new ForbiddenException('You cannot request deleted news');
    }

    const trimmedSearch = query.search?.trim();

    return this.prisma.generalNews.findMany({
      where: {
        cityId,
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(trimmedSearch
          ? {
              OR: [
                {
                  title: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  content: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        publisherId: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCityNewsById(cityId: string, newsId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);
    const canManageNews = await this.canManageNews(cityId, userId);

    const news = await this.prisma.generalNews.findFirst({
      where: {
        id: newsId,
        cityId,
        ...(canManageNews ? {} : { deletedAt: null }),
      },
      select: {
        id: true,
        publisherId: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!news) {
      throw new NotFoundException('News not found');
    }

    return news;
  }

  async updateCityNews(
    cityId: string,
    newsId: string,
    userId: string,
    dto: UpdateNewsDto,
  ) {
    await this.ensureCityMembership(cityId, userId);

    const existing = await this.prisma.generalNews.findFirst({
      where: {
        id: newsId,
        cityId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('News not found');
    }

    if (existing.deletedAt) {
      throw new BadRequestException('Cannot edit deleted news');
    }

    const updateData: { title?: string; content?: string } = {};
    if (typeof dto.title === 'string') {
      updateData.title = dto.title.trim();
    }
    if (typeof dto.content === 'string') {
      updateData.content = dto.content.trim();
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.generalNews.update({
        where: { id: newsId },
        data: updateData,
        select: {
          id: true,
          publisherId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'news',
          aggregateId: updated.id,
          eventType: DOMAIN_EVENT_TYPES.NEWS_UPDATED,
          payload: buildNewsEventPayload({
            cityId,
            newsId: updated.id,
            publisherId: updated.publisherId,
            title: updated.title,
          }),
        },
      });

      return updated;
    });
  }

  async softDeleteCityNews(cityId: string, newsId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    const existing = await this.prisma.generalNews.findFirst({
      where: {
        id: newsId,
        cityId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('News not found');
    }

    if (existing.deletedAt) {
      return {
        success: true,
        deleted: false,
        message: 'News already deleted',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.generalNews.update({
        where: { id: newsId },
        data: {
          deletedAt: new Date(),
        },
        select: {
          id: true,
          publisherId: true,
          title: true,
        },
      });

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'news',
          aggregateId: deleted.id,
          eventType: DOMAIN_EVENT_TYPES.NEWS_DELETED,
          payload: buildNewsEventPayload({
            cityId,
            newsId: deleted.id,
            publisherId: deleted.publisherId,
            title: deleted.title,
          }),
        },
      });
    });

    return {
      success: true,
      deleted: true,
    };
  }

  private async ensureCityMembership(cityId: string, userId: string) {
    const membership = await this.prisma.userCity.findUnique({
      where: {
        userId_cityId: {
          userId,
          cityId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this city');
    }
  }

  private async canManageNews(cityId: string, userId: string) {
    return this.rbacService.hasPermission(
      userId,
      cityId,
      PERMISSIONS_KEYS.NEWS_MANAGE,
    );
  }
}
