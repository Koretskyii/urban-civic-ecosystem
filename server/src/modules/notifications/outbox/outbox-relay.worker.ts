import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class OutboxRelayWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private relayTickRunning = false;

  constructor(private readonly notificationsService: NotificationsService) {}

  private async runRelayTick(batchSize: number) {
    if (this.relayTickRunning) {
      this.logger.warn('Previous outbox relay tick is still running; skipping');
      return;
    }

    this.relayTickRunning = true;
    try {
      await this.notificationsService.relayPending(batchSize);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown relay error';
      this.logger.error(`Outbox relay tick failed: ${message}`);
    } finally {
      this.relayTickRunning = false;
    }
  }

  onModuleInit() {
    const enabled = process.env.NOTIFICATIONS_WORKER_ENABLED !== 'false';
    if (!enabled) {
      this.logger.log(
        'Outbox relay worker is disabled by NOTIFICATIONS_WORKER_ENABLED=false',
      );
      return;
    }

    const intervalMs = Math.max(
      1000,
      Number(process.env.NOTIFICATIONS_RELAY_INTERVAL_MS ?? 5000),
    );
    const batchSize = Math.max(
      1,
      Number(process.env.NOTIFICATIONS_RELAY_BATCH_SIZE ?? 100),
    );

    this.timer = setInterval(() => {
      void this.runRelayTick(batchSize);
    }, intervalMs);

    this.logger.log(
      `Outbox relay worker started (interval=${intervalMs}ms, batch=${batchSize})`,
    );
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
