import type { CityRequestRealtimeEvent } from '@/types';

export const CITY_REQUESTS_SOCKET_NAMESPACE = '/city-requests';
export const CITY_REQUESTS_JOIN_ROOM_EVENT = 'join_room';

export const CITY_REQUESTS_REALTIME_EVENTS: readonly CityRequestRealtimeEvent[] =
  [
    'message.created',
    'report.created',
    'status.updated',
    'assignment.updated',
  ] as const;
