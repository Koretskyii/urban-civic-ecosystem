import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type NotificationSseEvent = {
  type: 'notification.refresh';
  timestamp: string;
};

@Injectable()
export class NotificationsSseGateway {
  private readonly stream$ = new Subject<NotificationSseEvent>();

  get stream() {
    return this.stream$.asObservable();
  }

  emit(event: NotificationSseEvent) {
    this.stream$.next(event);
  }
}
