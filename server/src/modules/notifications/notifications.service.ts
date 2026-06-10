import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OutboxRepository } from './outbox/outbox.repository';
import { NotificationsProducer } from './queue/notifications.producer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxRepository: OutboxRepository,
    private readonly notificationsProducer: NotificationsProducer,
  ) {}

  async relayPending(limit = 100) {
    const events = await this.outboxRepository.takePending(limit);
    this.logger.log(`relayPending limit=${limit} taken=${events.length}`);
    for (const event of events) {
      this.logger.debug(
        `enqueue outboxEventId=${event.id} eventType=${event.eventType}`,
      );
      await this.notificationsProducer.enqueue(event.id);
    }
    return { queued: events.length };
  }

  async enqueueById(outboxEventId: string) {
    await this.notificationsProducer.enqueue(outboxEventId);
    return { queued: true };
  }

  async listForUser(
    userId: string,
    cityId?: string,
    onlyUnread?: boolean,
    limit = 20,
    cursor?: string,
  ) {
    const take = Math.min(Math.max(limit, 1), 100);
    this.logger.log(
      `listForUser userId=${userId} cityId=${cityId ?? 'none'} onlyUnread=${Boolean(onlyUnread)} take=${take} cursor=${cursor ?? 'none'}`,
    );
    const rows = await this.prisma.inAppNotification.findMany({
      where: {
        userId,
        ...(cityId ? { cityId } : {}),
        ...(onlyUnread ? { isRead: false } : {}),
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    this.logger.log(
      `listForUser result userId=${userId} cityId=${cityId ?? 'none'} rows=${rows.length}`,
    );

    return {
      items: rows,
      nextCursor: rows.length === take ? rows[rows.length - 1]?.id : null,
    };
  }

  async unreadCountForUser(userId: string, cityId?: string) {
    this.logger.log(
      `unreadCountForUser userId=${userId} cityId=${cityId ?? 'none'}`,
    );
    const count = await this.prisma.inAppNotification.count({
      where: { userId, isRead: false, ...(cityId ? { cityId } : {}) },
    });
    this.logger.log(
      `unreadCountForUser result userId=${userId} cityId=${cityId ?? 'none'} count=${count}`,
    );
    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    this.logger.log(
      `markRead userId=${userId} notificationId=${notificationId}`,
    );
    const updated = await this.prisma.inAppNotification.updateMany({
      where: { id: notificationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    this.logger.log(`markRead result updated=${updated.count}`);
    return { updated: updated.count > 0 };
  }

  async markAllRead(userId: string, cityId?: string) {
    this.logger.log(`markAllRead userId=${userId} cityId=${cityId ?? 'none'}`);
    const updated = await this.prisma.inAppNotification.updateMany({
      where: { userId, isRead: false, ...(cityId ? { cityId } : {}) },
      data: { isRead: true, readAt: new Date() },
    });
    this.logger.log(`markAllRead result updated=${updated.count}`);
    return { updated: updated.count };
  }
}
