import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import type { RequestWithUser } from '@/types/auth.types';
import { CityAnalyticsService } from './city-analytics.service';
import { AnalyticsQueryDto } from '../dto';

@Controller('city/:cityId/analytics')
@UseGuards(JWTGuard)
export class CityAnalyticsController {
  constructor(private readonly cityAnalyticsService: CityAnalyticsService) {}

  @Get('requests')
  getRequests(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.cityAnalyticsService.getRequestsAnalytics(
      cityId,
      req.user.id,
      query,
    );
  }

  @Get('requests/geo')
  getRequestsGeo(@Param('cityId') cityId: string, @Req() req: RequestWithUser) {
    return this.cityAnalyticsService.getRequestsGeo(cityId, req.user.id);
  }

  @Get('surveys')
  getSurveys(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.cityAnalyticsService.getSurveysAnalytics(
      cityId,
      req.user.id,
      query,
    );
  }

  @Get('alerts')
  getAlerts(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.cityAnalyticsService.getAlertsAnalytics(
      cityId,
      req.user.id,
      query,
    );
  }
}
