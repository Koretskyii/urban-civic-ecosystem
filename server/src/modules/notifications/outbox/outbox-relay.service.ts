import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class OutboxRelayService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async relayPending(limit = 100) {
    return this.notificationsService.relayPending(limit);
  }
}
