import { Controller, Get, Param } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('city/:cityId/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getCityAlerts(@Param('cityId') cityId: string) {
    return this.alertsService.getCityAlerts(cityId);
  }
}
