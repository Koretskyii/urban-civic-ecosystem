import { Injectable, Logger } from '@nestjs/common';
import { InAppNotificationType, type Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class InAppNotificationService {
  private readonly logger = new Logger(InAppNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createForCityMembers(
    cityId: string,
    type: InAppNotificationType,
    title: string,
    payload: Prisma.InputJsonValue,
    excludeUserId?: string,
    options?: {
      eventId?: string;
      body?: string | null;
      link?: string | null;
    },
  ) {
    this.logger.log(
      `createForCityMembers cityId=${cityId} type=${type} excludeUserId=${excludeUserId ?? 'none'}`,
    );
    const members = await this.prisma.userCity.findMany({
      where: {
        cityId,
        isBlocked: false,
        user: { isBlocked: false },
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      select: { userId: true },
    });

    this.logger.log(`createForCityMembers membersFound=${members.length}`);
    if (members.length === 0) return 0;

    return this.createForUsers(
      members.map((m) => m.userId),
      cityId,
      type,
      title,
      payload,
      options,
    );
  }

  async createForUsers(
    userIds: string[],
    cityId: string,
    type: InAppNotificationType,
    title: string,
    payload: Prisma.InputJsonValue,
    options?: {
      eventId?: string;
      body?: string | null;
      link?: string | null;
    },
  ) {
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

    if (uniqueUserIds.length === 0) {
      return 0;
    }

    const result = await this.prisma.inAppNotification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        cityId,
        type,
        eventId: options?.eventId,
        title,
        body: options?.body,
        link: options?.link,
        payload,
      })),
      skipDuplicates: true,
    });
    this.logger.log(`createForUsers created=${result.count}`);

    return result.count;
  }
}
