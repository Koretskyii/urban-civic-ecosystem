import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { SystemAdminGuard } from '@/modules/admin/guards/system-admin.guard';
import { CityAnalyticsController } from './city/city-analytics.controller';
import { CityAnalyticsService } from './city/city-analytics.service';
import { SystemAnalyticsController } from './system/system-analytics.controller';
import { SystemAnalyticsService } from './system/system-analytics.service';
import { AnalyticsCacheService } from './analytics-cache.service';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [CityAnalyticsController, SystemAnalyticsController],
  providers: [
    CityAnalyticsService,
    SystemAnalyticsService,
    AnalyticsCacheService,
    SystemAdminGuard,
  ],
})
export class AnalyticsModule {}
