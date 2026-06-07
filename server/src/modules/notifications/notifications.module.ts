import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './api/notifications.controller';
import { OutboxRepository } from './outbox/outbox.repository';
import { OutboxRelayService } from './outbox/outbox-relay.service';
import { NotificationsProducer } from './queue/notifications.producer';
import { NotificationsProcessor } from './queue/notifications.processor';
import { NOTIFICATIONS_QUEUE } from './queue/notifications.queue';
import { InAppNotificationService } from './in-app/in-app-notification.service';
import { EmailNotificationService } from './email/email-notification.service';
import { ResendEmailService } from './email/resend-email.service';
import { NotificationsSseController } from './sse/notifications-sse.controller';
import { NotificationsSseGateway } from './sse/notifications-sse.gateway';
import { OutboxRelayWorker } from './outbox/outbox-relay.worker';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  controllers: [NotificationsController, NotificationsSseController],
  providers: [
    NotificationsService,
    OutboxRepository,
    OutboxRelayService,
    NotificationsProducer,
    NotificationsProcessor,
    InAppNotificationService,
    EmailNotificationService,
    ResendEmailService,
    NotificationsSseGateway,
    OutboxRelayWorker,
  ],
  exports: [NotificationsService, OutboxRelayService],
})
export class NotificationsModule {}
