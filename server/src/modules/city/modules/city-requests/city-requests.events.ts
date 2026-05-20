export const CITY_REQUESTS_SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  ROOM_JOINED: 'room.joined',
  MESSAGE_CREATED: 'message.created',
  REPORT_CREATED: 'report.created',
  STATUS_UPDATED: 'status.updated',
  ASSIGNMENT_UPDATED: 'assignment.updated',
} as const;

export type CityRequestRealtimeEnvelope<TPayload = unknown> = {
  requestId: string;
  emittedAt: string;
  payload: TPayload;
};
