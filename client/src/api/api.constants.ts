export const CITY_REQUESTS_DEFAULT_FILTER_FIELDS = {
  scope: 'all',
  status: 'all-statuses',
  departmentId: 'all-departments',
  priority: 'all-priorities',
  search: '',
  limit: 'default-limit',
  sortBy: 'createdAt',
  sortOrder: 'desc',
} as const;

export const CITY_NEWS_DEFAULT_FILTER_FIELDS = {
  includeDeleted: false,
  search: '',
  limit: 'default-limit',
  sortBy: 'createdAt',
  sortOrder: 'desc',
} as const;

export const CITY_ALERTS_DEFAULT_FILTER_FIELDS = {
  includeDeleted: false,
  onlyActive: true,
  severity: '',
  alertTypeId: '',
  search: '',
  limit: 'default-limit',
  sortBy: 'severity',
  sortOrder: 'asc',
} as const;

export const CITY_MEMBERS_DEFAULT_FILTER_FIELDS = {
  search: '',
  role: 'all-roles',
  limit: 'default-limit',
  page: 'default-page',
  sortBy: 'joinedAt',
  sortOrder: 'asc',
} as const;
