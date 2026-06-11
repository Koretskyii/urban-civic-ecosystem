import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';

@Injectable()
export class SurveysSweepWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SurveysSweepWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private sweepRunning = false;

  constructor(private readonly surveysService: SurveysService) {}

  private async runSweepTick(batchSize: number) {
    if (this.sweepRunning) {
      this.logger.warn('Previous survey sweep tick is still running; skipping');
      return;
    }

    this.sweepRunning = true;
    try {
      const closed = await this.surveysService.closeExpiredSurveys(batchSize);
      if (closed > 0) {
        this.logger.log(`Survey sweep: closed ${closed} expired survey(s)`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown sweep error';
      this.logger.error(`Survey sweep tick failed: ${message}`);
    } finally {
      this.sweepRunning = false;
    }
  }

  onModuleInit() {
    const enabled = process.env.SURVEY_SWEEP_ENABLED !== 'false';
    if (!enabled) {
      this.logger.log(
        'Survey sweep worker disabled by SURVEY_SWEEP_ENABLED=false',
      );
      return;
    }

    const intervalMs = Math.max(
      10000,
      Number(process.env.SURVEY_SWEEP_INTERVAL_MS ?? 60000),
    );
    const batchSize = Math.max(
      1,
      Number(process.env.SURVEY_SWEEP_BATCH_SIZE ?? 50),
    );

    this.timer = setInterval(() => {
      void this.runSweepTick(batchSize);
    }, intervalMs);

    this.logger.log(
      `Survey sweep worker started (interval=${intervalMs}ms, batch=${batchSize})`,
    );
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
