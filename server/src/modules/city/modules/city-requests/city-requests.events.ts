export const CITY_REQUESTS_SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  ROOM_JOINED: 'room.joined',
  MESSAGE_CREATED: 'message.created',
  REPORT_CREATED: 'report.created',
  STATUS_UPDATED: 'status.updated',
  ASSIGNMENT_UPDATED: 'assignment.updated',
} as const;

export const CITY_REQUESTS_MUTATION_EVENTS = {
  MESSAGE_CREATED: CITY_REQUESTS_SOCKET_EVENTS.MESSAGE_CREATED,
  REPORT_CREATED: CITY_REQUESTS_SOCKET_EVENTS.REPORT_CREATED,
  STATUS_UPDATED: CITY_REQUESTS_SOCKET_EVENTS.STATUS_UPDATED,
  ASSIGNMENT_UPDATED: CITY_REQUESTS_SOCKET_EVENTS.ASSIGNMENT_UPDATED,
} as const;

export type CityRequestsMutationEvent =
  keyof typeof CITY_REQUESTS_MUTATION_EVENTS;
export type CityRequestsMutationSocketEvent =
  (typeof CITY_REQUESTS_MUTATION_EVENTS)[CityRequestsMutationEvent];

export type CityRequestRealtimeEnvelope<TPayload = unknown> = {
  requestId: string;
  emittedAt: string;
  payload: TPayload;
};
