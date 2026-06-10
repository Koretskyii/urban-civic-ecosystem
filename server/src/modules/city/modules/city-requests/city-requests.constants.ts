export const CITY_REQUESTS_CONSTANTS = {
  SOCKET_NAMESPACE: '/city-requests',
  ROOM_PREFIX: 'city-request',
  ATTACHMENT_TYPES: {
    REQUEST: 'REQUEST_ATTACHMENT',
    REPORT: 'REPORT_ATTACHMENT',
  },
  LIMITS: {
    REQUEST_ATTACHMENTS_MAX: 1,
    REPORT_ATTACHMENTS_MAX: 1,
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
  TOO_MANY_REQUEST_ATTACHMENTS:
    'Only one attachment can be added to a city request',
  INVALID_REQUEST_ATTACHMENT_TYPE:
    'Only image attachments can be added to a city request',
  TOO_MANY_REPORT_ATTACHMENTS:
    'Only one attachment can be added to a city request report',
  PROGRESS_REPORT_REQUIRES_IN_PROGRESS:
    'Progress report can be created only for in-progress city requests',
  FINAL_REPORT_ALREADY_EXISTS:
    'Final report already exists for this city request',
} as const;
