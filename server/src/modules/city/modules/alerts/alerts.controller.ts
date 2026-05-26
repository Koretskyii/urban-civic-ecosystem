import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { RequirePermissions } from '@/modules/rbac/decorators/permissions.decorators';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import type { RequestWithUser } from '@/types/auth.types';
import { CreateAlertDto, GetAlertsQueryDto, UpdateAlertDto } from './dto';

@Controller('city/:cityId/alerts')
@UseGuards(JWTGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.ALERT_CREATE)
  createAlert(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateAlertDto,
  ) {
    return this.alertsService.createCityAlert(cityId, req.user.id, dto);
  }

  @Get()
  getCityAlerts(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Query() query: GetAlertsQueryDto,
  ) {
    return this.alertsService.getCityAlerts(cityId, req.user.id, query);
  }

  @Get('types')
  getAlertTypes(@Param('cityId') cityId: string, @Req() req: RequestWithUser) {
    return this.alertsService.getAlertTypes(cityId, req.user.id);
  }

  @Get(':alertId')
  getCityAlertById(
    @Param('cityId') cityId: string,
    @Param('alertId') alertId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.alertsService.getCityAlertById(cityId, alertId, req.user.id);
  }

  @Patch(':alertId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.ALERT_UPDATE)
  updateAlert(
    @Param('cityId') cityId: string,
    @Param('alertId') alertId: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alertsService.updateCityAlert(cityId, alertId, req.user.id, dto);
  }

  @Delete(':alertId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.ALERT_DELETE)
  softDeleteAlert(
    @Param('cityId') cityId: string,
    @Param('alertId') alertId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.alertsService.softDeleteCityAlert(cityId, alertId, req.user.id);
  }
}
