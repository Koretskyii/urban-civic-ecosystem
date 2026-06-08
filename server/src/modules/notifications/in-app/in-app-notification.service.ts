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

    const result = await this.prisma.inAppNotification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        cityId,
        type,
        title,
        payload,
      })),
    });
    this.logger.log(`createForCityMembers created=${result.count}`);

    return result.count;
  }
}
