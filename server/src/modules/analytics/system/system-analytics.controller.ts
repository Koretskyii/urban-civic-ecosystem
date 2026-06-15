import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { SystemAdminGuard } from '@/modules/admin/guards/system-admin.guard';
import { SystemAnalyticsService } from './system-analytics.service';
import { AnalyticsQueryDto } from '../dto';

@Controller('admin/analytics')
@UseGuards(JWTGuard, SystemAdminGuard)
export class SystemAnalyticsController {
  constructor(
    private readonly systemAnalyticsService: SystemAnalyticsService,
  ) {}

  @Get('overview')
  getOverview(@Query() query: AnalyticsQueryDto) {
    return this.systemAnalyticsService.getOverview(query);
  }
}
