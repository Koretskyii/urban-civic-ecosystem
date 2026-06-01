import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { DomainEventOutbox, Prisma } from '@/generated/prisma/client';
import type { DomainEventType } from '@/modules/notifications/domain/domain-events.types';
import {
  EVENT_PAYLOAD_DTO_MAP,
  EVENT_TYPE_TO_NOTIFICATION_TYPE,
} from '../notifications.constants';
import { InAppNotificationService } from '../in-app/in-app-notification.service';
import { OutboxRepository } from '../outbox/outbox.repository';
import { NotificationsSseGateway } from '../sse/notifications-sse.gateway';
import { NOTIFICATIONS_QUEUE } from './notifications.queue';

@Injectable()
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly inAppNotificationService: InAppNotificationService,
    private readonly sseGateway: NotificationsSseGateway,
  ) {
    super();
  }

  async process(job: Job<{ outboxEventId: string }>) {
    this.logger.log(
      `process jobId=${job.id} outboxEventId=${job.data?.outboxEventId ?? 'missing'}`,
    );
    const outboxEventId = job.data?.outboxEventId;
    if (!outboxEventId) {
      throw new BadRequestException('Missing outboxEventId in queue payload');
    }

    const outboxEvent = await this.outboxRepository.getById(outboxEventId);
    if (!outboxEvent) {
      throw new NotFoundException(`Outbox event not found: ${outboxEventId}`);
    }

    try {
      await this.processOutboxEvent(outboxEvent);
      await this.outboxRepository.markProcessed(outboxEvent.id);
      this.logger.log(
        `processed outboxEventId=${outboxEvent.id} status=PROCESSED`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';
      await this.outboxRepository.markFailed(outboxEvent.id, message);
      this.logger.error(
        `failed outboxEventId=${outboxEvent.id} error=${message}`,
      );
      throw error;
    }
  }

  private async processOutboxEvent(outboxEvent: DomainEventOutbox) {
    const eventType = outboxEvent.eventType as DomainEventType;
    const dtoClass = EVENT_PAYLOAD_DTO_MAP[eventType];

    if (!dtoClass) {
      throw new BadRequestException(
        `Unsupported eventType: ${outboxEvent.eventType}`,
      );
    }

    const payload = plainToInstance(dtoClass, outboxEvent.payload as object);
    const errors = await validate(payload, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      this.logger.error(
        `payload validation failed outboxEventId=${outboxEvent.id} eventType=${outboxEvent.eventType} errors=${errors.length}`,
      );
      throw new BadRequestException('Invalid outbox payload');
    }

    const cityId = (payload as { cityId: string }).cityId;
    const title = (payload as { title: string }).title;
    const publisherId = (payload as { publisherId?: string }).publisherId;

    const created = await this.inAppNotificationService.createForCityMembers(
      cityId,
      EVENT_TYPE_TO_NOTIFICATION_TYPE[eventType],
      title,
      outboxEvent.payload as Prisma.InputJsonValue,
      publisherId,
    );
    this.logger.log(
      `processOutboxEvent outboxEventId=${outboxEvent.id} cityId=${cityId} eventType=${eventType} created=${created}`,
    );

    if (created > 0) {
      this.sseGateway.emit({
        type: 'notification.refresh',
        timestamp: new Date().toISOString(),
      });
    }

    return created;
  }
}
