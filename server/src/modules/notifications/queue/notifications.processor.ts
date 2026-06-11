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
import { DOMAIN_EVENT_TYPES } from '@/modules/notifications/domain/domain-events';
import type { DomainEventType } from '@/modules/notifications/domain/domain-events.types';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import { PrismaService } from '@/prisma/prisma.service';
import {
  EVENT_TYPE_TO_EMAIL_ENABLED,
  EVENT_PAYLOAD_DTO_MAP,
  EVENT_TYPE_TO_NOTIFICATION_TYPE,
} from '../notifications.const';
import { EmailNotificationService } from '../email/email-notification.service';
import { InAppNotificationService } from '../in-app/in-app-notification.service';
import { OutboxRepository } from '../outbox/outbox.repository';
import { NotificationsSseGateway } from '../sse/notifications-sse.gateway';
import { NOTIFICATIONS_QUEUE } from './notifications.queue';

@Injectable()
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxRepository: OutboxRepository,
    private readonly inAppNotificationService: InAppNotificationService,
    private readonly emailNotificationService: EmailNotificationService,
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

    const payloadRecord = outboxEvent.payload as Record<string, unknown>;
    const cityId = String(payloadRecord.cityId);
    const title = String(payloadRecord.title);
    const eventId =
      typeof payloadRecord.eventId === 'string' ? payloadRecord.eventId : null;
    const link = this.buildNotificationLink(eventType, payloadRecord, cityId);
    const body = this.buildNotificationBody(eventType, payloadRecord);
    const recipients = await this.resolveRecipients(eventType, payloadRecord);

    const created = await this.inAppNotificationService.createForUsers(
      recipients.map((recipient) => recipient.userId),
      cityId,
      EVENT_TYPE_TO_NOTIFICATION_TYPE[eventType],
      title,
      outboxEvent.payload as Prisma.InputJsonValue,
      {
        eventId: eventId ?? undefined,
        body,
        link,
      },
    );
    this.logger.log(
      `processOutboxEvent outboxEventId=${outboxEvent.id} cityId=${cityId} eventType=${eventType} recipients=${recipients.length} created=${created}`,
    );

    if (EVENT_TYPE_TO_EMAIL_ENABLED[eventType]) {
      const emailResult = await this.emailNotificationService.sendForRecipients(
        {
          outboxEvent,
          recipients,
          subject: this.buildEmailSubject(eventType, title),
          text: this.buildEmailText(eventType, payloadRecord, link, body),
          html: this.buildEmailHtml(eventType, payloadRecord, link, body),
        },
      );
      this.logger.log(
        `email processed outboxEventId=${outboxEvent.id} eventType=${eventType} sent=${emailResult.sent} failed=${emailResult.failed}`,
      );
    }

    if (created > 0) {
      this.sseGateway.emit({
        type: 'notification.refresh',
        timestamp: new Date().toISOString(),
      });
    }

    return created;
  }

  private getActorId(payload: Record<string, unknown>) {
    const actorId = payload.actorId;
    if (typeof actorId === 'string' && actorId.length > 0) return actorId;

    const publisherId = payload.publisherId;
    if (typeof publisherId === 'string' && publisherId.length > 0) {
      return publisherId;
    }

    return null;
  }

  private async resolveRecipients(
    eventType: DomainEventType,
    payload: Record<string, unknown>,
  ) {
    const cityId = String(payload.cityId);
    const actorId = this.getActorId(payload);

    if (this.isCityRequestEvent(eventType)) {
      return this.resolveCityRequestRecipients(cityId, payload, actorId);
    }

    return this.getActiveCityMembers(cityId, actorId);
  }

  private async resolveCityRequestRecipients(
    cityId: string,
    payload: Record<string, unknown>,
    actorId: string | null,
  ) {
    const requesterId =
      typeof payload.requesterId === 'string' ? payload.requesterId : null;

    if (!requesterId) {
      return [];
    }

    if (actorId === requesterId) {
      return this.getCityManagers(cityId, actorId);
    }

    const requester = await this.prisma.userCity.findFirst({
      where: {
        cityId,
        userId: requesterId,
        isBlocked: false,
        user: { isBlocked: false },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!requester || requester.user.id === actorId) {
      return [];
    }

    return [{ userId: requester.user.id, email: requester.user.email }];
  }

  private async getActiveCityMembers(
    cityId: string,
    excludeUserId?: string | null,
  ) {
    const members = await this.prisma.userCity.findMany({
      where: {
        cityId,
        isBlocked: false,
        user: { isBlocked: false },
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return members.map((member) => ({
      userId: member.user.id,
      email: member.user.email,
    }));
  }

  private async getCityManagers(cityId: string, excludeUserId?: string | null) {
    const managerRoleNames = await this.prisma.rolePermission.findMany({
      where: {
        permission: {
          key: PERMISSIONS_KEYS.CITY_REQUEST_MANAGE,
        },
      },
      select: {
        roleName: true,
      },
    });
    const roleNames = managerRoleNames.map((role) => role.roleName);

    if (roleNames.length === 0) {
      return [];
    }

    const members = await this.prisma.userCity.findMany({
      where: {
        cityId,
        isBlocked: false,
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
        user: {
          isBlocked: false,
          userRoles: {
            some: {
              role: {
                cityId,
                name: { in: roleNames },
              },
            },
          },
        },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return members.map((member) => ({
      userId: member.user.id,
      email: member.user.email,
    }));
  }

  private isCityRequestEvent(eventType: DomainEventType) {
    return eventType.startsWith('city_request.');
  }

  private buildNotificationLink(
    eventType: DomainEventType,
    payload: Record<string, unknown>,
    cityId: string,
  ) {
    if (eventType.startsWith('news.')) {
      const newsId = this.getAggregateId(payload);
      return newsId ? `/city/${cityId}/news/${newsId}` : `/city/${cityId}/news`;
    }

    if (eventType.startsWith('alert.')) {
      const alertId = this.getAggregateId(payload);
      return alertId
        ? `/city/${cityId}/alerts/${alertId}`
        : `/city/${cityId}/alerts`;
    }

    if (this.isCityRequestEvent(eventType)) {
      const requestId =
        typeof payload.requestId === 'string'
          ? payload.requestId
          : this.getAggregateId(payload);
      return requestId
        ? `/city/${cityId}/city-requests/${requestId}`
        : `/city/${cityId}/city-requests`;
    }

    if (eventType.startsWith('survey.')) {
      const surveyId = this.getAggregateId(payload);
      return surveyId
        ? `/city/${cityId}/surveys/${surveyId}`
        : `/city/${cityId}/surveys`;
    }

    return `/city/${cityId}`;
  }

  private getAggregateId(payload: Record<string, unknown>) {
    if (typeof payload.aggregateId === 'string') return payload.aggregateId;
    if (typeof payload.agregateId === 'string') return payload.agregateId;
    return null;
  }

  private buildNotificationBody(
    eventType: DomainEventType,
    payload: Record<string, unknown>,
  ) {
    if (eventType === DOMAIN_EVENT_TYPES.ALERT_CREATED) {
      const severity =
        typeof payload.severity === 'string' ? payload.severity : null;
      return severity ? `Severity: ${severity}` : null;
    }

    if (eventType === DOMAIN_EVENT_TYPES.ALERT_UPDATED) {
      const severity =
        typeof payload.severity === 'string' ? payload.severity : null;
      return severity
        ? `Alert updated. Severity: ${severity}`
        : 'Alert updated';
    }

    if (eventType === DOMAIN_EVENT_TYPES.CITY_REQUEST_ASSIGNED) {
      const departmentName =
        typeof payload.departmentName === 'string'
          ? payload.departmentName
          : null;
      return departmentName
        ? `Assigned department: ${departmentName}`
        : 'Department assignment updated';
    }

    if (eventType === DOMAIN_EVENT_TYPES.CITY_REQUEST_STATUS_UPDATED) {
      const status = typeof payload.status === 'string' ? payload.status : null;
      return status ? `Status: ${status}` : 'Status updated';
    }

    if (eventType === DOMAIN_EVENT_TYPES.CITY_REQUEST_REPORT_CREATED) {
      const reportType =
        typeof payload.reportType === 'string' ? payload.reportType : null;
      return reportType ? `Report: ${reportType}` : 'New report added';
    }

    if (eventType === DOMAIN_EVENT_TYPES.CITY_REQUEST_MESSAGE_CREATED) {
      return typeof payload.messagePreview === 'string'
        ? payload.messagePreview
        : 'New message added';
    }

    if (eventType === DOMAIN_EVENT_TYPES.SURVEY_CLOSED) {
      return 'Voting has ended';
    }

    return null;
  }

  private buildEmailSubject(eventType: DomainEventType, title: string) {
    if (eventType.startsWith('alert.')) {
      return `City alert: ${title}`;
    }

    if (this.isCityRequestEvent(eventType)) {
      return `City request update: ${title}`;
    }

    return title;
  }

  private buildEmailText(
    eventType: DomainEventType,
    payload: Record<string, unknown>,
    link: string,
    body: string | null,
  ) {
    const clientUrl = process.env.CLIENT_URL || 'https://localhost:3000';
    const title = this.getPayloadTitle(payload);
    const cityLine = `City ID: ${String(payload.cityId)}`;
    const detailLine = body ? `\n${body}` : '';
    const urlLine = `${clientUrl}${link}`;

    if (this.isCityRequestEvent(eventType)) {
      const requestTitle =
        typeof payload.requestTitle === 'string' ? payload.requestTitle : title;
      return `${title}\nRequest: ${requestTitle}\n${cityLine}${detailLine}\n\nOpen: ${urlLine}`;
    }

    return `${title}\n${cityLine}${detailLine}\n\nOpen: ${urlLine}`;
  }

  private buildEmailHtml(
    eventType: DomainEventType,
    payload: Record<string, unknown>,
    link: string,
    body: string | null,
  ) {
    const clientUrl = process.env.CLIENT_URL || 'https://localhost:3000';
    const title = this.escapeHtml(this.getPayloadTitle(payload));
    const requestTitle =
      typeof payload.requestTitle === 'string'
        ? this.escapeHtml(payload.requestTitle)
        : title;
    const details = body ? `<p>${this.escapeHtml(body)}</p>` : '';
    const fullUrl = `${clientUrl}${link}`;
    const url = this.escapeHtml(fullUrl);
    const requestLine = this.isCityRequestEvent(eventType)
      ? `<p><strong>Request:</strong> ${requestTitle}</p>`
      : '';

    return `
      <div>
        <h2>${title}</h2>
        ${requestLine}
        ${details}
        <p><a href="${url}">Open in Urban Civic Ecosystem</a></p>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private getPayloadTitle(payload: Record<string, unknown>) {
    return typeof payload.title === 'string' ? payload.title : 'Notification';
  }
}
