import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';

@Controller('city/:cityId/alerts')
@UseGuards(JWTGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getCityAlerts(@Param('cityId') cityId: string) {
    return this.alertsService.getCityAlerts(cityId);
  }
}
