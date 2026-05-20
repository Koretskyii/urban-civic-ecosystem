export const CITY_REQUESTS_CONSTANTS = {
  CONTEXT_TYPE: 'cityRequest',
  ROOM_PREFIX: 'city-request',
  ATTACHMENT_TYPES: {
    REQUEST: 'REQUEST_ATTACHMENT',
    REPORT: 'REPORT_ATTACHMENT',
  },
  ENTITY_TYPES: {
    CITY_REQUEST: 'CITY_REQUEST',
    REPORT: 'REPORT',
  },
} as const;

export const CITY_REQUESTS_ERRORS = {
  REQUEST_NOT_FOUND: 'City request not found',
  CHAT_NOT_FOUND: 'City request chat not found',
  DEPARTMENT_UNAVAILABLE: 'Department is not available',
  USER_NOT_CITY_MEMBER: 'User is not a city member',
  INSUFFICIENT_MANAGE_PERMISSIONS:
    'Insufficient permissions to manage city requests',
  RESOLUTION_REJECTION_REQUIRES_DESCRIPTION:
    'Resolution and rejection reports require description',
  RESOLVE_REJECT_USE_REPORT:
    'Use reports endpoint for RESOLVED/REJECTED with required report content',
} as const;
