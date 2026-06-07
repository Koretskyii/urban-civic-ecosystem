import { Injectable, Logger } from '@nestjs/common';
import type { DomainEventOutbox } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ResendEmailService } from './resend-email.service';

type EmailRecipient = {
  userId: string;
  email: string;
};

type SendNotificationEmailInput = {
  outboxEvent: DomainEventOutbox;
  recipients: EmailRecipient[];
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendEmailService: ResendEmailService,
  ) {}

  async sendForRecipients(input: SendNotificationEmailInput) {
    let sent = 0;
    let failed = 0;

    for (const recipient of input.recipients) {
      const delivery = await this.prisma.notificationDelivery.upsert({
        where: {
          outboxEventId_userId_channel: {
            outboxEventId: input.outboxEvent.id,
            userId: recipient.userId,
            channel: 'EMAIL',
          },
        },
        create: {
          outboxEventId: input.outboxEvent.id,
          userId: recipient.userId,
          channel: 'EMAIL',
          recipient: recipient.email,
          subject: input.subject,
        },
        update: {
          recipient: recipient.email,
          subject: input.subject,
        },
      });

      if (delivery.status === 'SENT') {
        continue;
      }

      try {
        await this.resendEmailService.send({
          to: recipient.email,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });

        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'SENT',
            attempts: { increment: 1 },
            lastError: null,
            sentAt: new Date(),
          },
        });
        sent += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown email error';
        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            attempts: { increment: 1 },
            lastError: message.slice(0, 2000),
          },
        });
        failed += 1;
        this.logger.warn(
          `Email delivery failed outboxEventId=${input.outboxEvent.id} userId=${recipient.userId} error=${message}`,
        );
      }
    }

    return { sent, failed };
  }
}
