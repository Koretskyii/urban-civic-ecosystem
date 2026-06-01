import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { NotificationsSseGateway } from './notifications-sse.gateway';

@Controller('notifications')
@UseGuards(JWTGuard)
export class NotificationsSseController {
  constructor(private readonly sseGateway: NotificationsSseGateway) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.sseGateway.stream.pipe(
      map((data) => ({ data: (data ?? {}) as string | object })),
    );
  }
}
