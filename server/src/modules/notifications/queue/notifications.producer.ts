import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATIONS_JOB_PROCESS_OUTBOX,
  NOTIFICATIONS_QUEUE,
} from './notifications.queue';

@Injectable()
export class NotificationsProducer {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  async enqueue(outboxEventId: string) {
    await this.queue.add(
      NOTIFICATIONS_JOB_PROCESS_OUTBOX,
      { outboxEventId },
      { removeOnComplete: true, removeOnFail: false },
    );
  }
}
