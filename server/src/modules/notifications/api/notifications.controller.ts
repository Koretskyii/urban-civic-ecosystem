import {
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import type { RequestWithUser } from '@/types/auth.types';
import { NotificationsService } from '../notifications.service';

@Controller('notifications')
@UseGuards(JWTGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Post('relay')
  relay(@Query('limit') limit?: string) {
    this.logger.log(`relay requested limit=${limit ?? 'default'}`);
    return this.notificationsService.relayPending(limit ? Number(limit) : 100);
  }

  @Get()
  list(
    @Req() req: RequestWithUser,
    @Query('cityId') cityId?: string,
    @Query('onlyUnread') onlyUnread?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    this.logger.log(
      `list userId=${req.user.id} cityId=${cityId ?? 'none'} onlyUnread=${onlyUnread ?? 'false'} limit=${limit ?? '20'} cursor=${cursor ?? 'none'}`,
    );
    return this.notificationsService.listForUser(
      req.user.id,
      cityId,
      onlyUnread === 'true',
      limit ? Number(limit) : 20,
      cursor,
    );
  }

  @Get('unread-count')
  unreadCount(@Req() req: RequestWithUser, @Query('cityId') cityId?: string) {
    this.logger.log(
      `unread-count userId=${req.user.id} cityId=${cityId ?? 'none'}`,
    );
    return this.notificationsService.unreadCountForUser(req.user.id, cityId);
  }

  @Patch(':id/read')
  markRead(@Req() req: RequestWithUser, @Param('id') id: string) {
    this.logger.log(`mark-read userId=${req.user.id} notificationId=${id}`);
    return this.notificationsService.markRead(req.user.id, id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: RequestWithUser, @Query('cityId') cityId?: string) {
    this.logger.log(
      `mark-all-read userId=${req.user.id} cityId=${cityId ?? 'none'}`,
    );
    return this.notificationsService.markAllRead(req.user.id, cityId);
  }
}
