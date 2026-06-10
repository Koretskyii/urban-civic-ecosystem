import type { PermissionKey, RoleKey } from '@/types/rbac.types';

// ─── Grouped Permissions ───
export const PERMISSION_GROUPS = {
  CITY: {
    CREATE: 'city:create' as PermissionKey,
    UPDATE: 'city:update' as PermissionKey,
    DELETE: 'city:delete' as PermissionKey,
    MANAGE: 'city:manage' as PermissionKey,
  },

  CITY_REQUEST: {
    CREATE: 'city_request:create' as PermissionKey,
    UPDATE: 'city_request:update' as PermissionKey,
    DELETE: 'city_request:delete' as PermissionKey,
    MANAGE: 'city_request:manage' as PermissionKey,
  },

  REPORT: {
    CREATE: 'report:create' as PermissionKey,
    UPDATE: 'report:update' as PermissionKey,
    DELETE: 'report:delete' as PermissionKey,
    MANAGE: 'report:manage' as PermissionKey,
  },

  NEWS: {
    CREATE: 'news:create' as PermissionKey,
    UPDATE: 'news:update' as PermissionKey,
    DELETE: 'news:delete' as PermissionKey,
    MANAGE: 'news:manage' as PermissionKey,
  },

  ALERT: {
    CREATE: 'alert:create' as PermissionKey,
    UPDATE: 'alert:update' as PermissionKey,
    DELETE: 'alert:delete' as PermissionKey,
    MANAGE: 'alert:manage' as PermissionKey,
  },

  CHAT: {
    CREATE: 'chat:create' as PermissionKey,
    UPDATE: 'chat:update' as PermissionKey,
    DELETE: 'chat:delete' as PermissionKey,
    MANAGE: 'chat:manage' as PermissionKey,
  },

  MESSAGE: {
    CREATE: 'message:create' as PermissionKey,
    UPDATE: 'message:update' as PermissionKey,
    DELETE: 'message:delete' as PermissionKey,
    MANAGE: 'message:manage' as PermissionKey,
  },

  ATTACHMENT: {
    CREATE: 'attachment:create' as PermissionKey,
    UPDATE: 'attachment:update' as PermissionKey,
    DELETE: 'attachment:delete' as PermissionKey,
    MANAGE: 'attachment:manage' as PermissionKey,
  },

  SURVEY: {
    CREATE: 'survey:create' as PermissionKey,
    UPDATE: 'survey:update' as PermissionKey,
    DELETE: 'survey:delete' as PermissionKey,
    MANAGE: 'survey:manage' as PermissionKey,
  },

  VOTE: {
    CREATE: 'vote:create' as PermissionKey,
    UPDATE: 'vote:update' as PermissionKey,
    DELETE: 'vote:delete' as PermissionKey,
    MANAGE: 'vote:manage' as PermissionKey,
  },

  ROLE: {
    CREATE: 'role:create' as PermissionKey,
    UPDATE: 'role:update' as PermissionKey,
    DELETE: 'role:delete' as PermissionKey,
    MANAGE: 'role:manage' as PermissionKey,
  },

  USER: {
    VIEW_PROFILE: 'user:view_profile' as PermissionKey,
    UPDATE_PROFILE: 'user:update_profile' as PermissionKey,
    DELETE_PROFILE: 'user:delete_profile' as PermissionKey,
    MANAGE_PROFILE: 'user:manage_profile' as PermissionKey,
  },
} as const;

export const RBAC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const RBAC_PERMISSIONS = {
  canCreateNews: [PERMISSION_GROUPS.NEWS.CREATE] as const,
  canManageNews: [PERMISSION_GROUPS.NEWS.MANAGE] as const,
  canCreateAlert: [PERMISSION_GROUPS.ALERT.CREATE] as const,
  canManageAlert: [PERMISSION_GROUPS.ALERT.MANAGE] as const,
  canManageRole: [PERMISSION_GROUPS.ROLE.MANAGE] as const,
} as const;

export const ROLE_ACCENT_CLASSES: Record<RoleKey, string> = {
  admin: 'border-[var(--primary)]/20 bg-[rgba(12,38,61,0.06)]',
  municipality: 'border-[var(--secondary)]/25 bg-[rgba(63,136,197,0.08)]',
  citizen: 'border-[var(--warning)]/40 bg-[rgba(255,186,8,0.10)]',
};

export const ROLE_CAPABILITY_KEYS: Record<RoleKey, string[]> = {
  admin: ['manageCity', 'manageRoles', 'publishContent', 'processRequests'],
  municipality: ['processRequests', 'publishAlerts', 'coordinateDepartments'],
  citizen: ['createRequests', 'followUpdates'],
};

export const inferRoleFromPermissions = (
  permissions: PermissionKey[],
): RoleKey | null => {
  const permissionSet = new Set<PermissionKey>(permissions);

  if (
    permissionSet.has(PERMISSION_GROUPS.ROLE.MANAGE) ||
    permissionSet.has(PERMISSION_GROUPS.CITY.MANAGE) ||
    permissionSet.has(PERMISSION_GROUPS.USER.MANAGE_PROFILE)
  ) {
    return 'admin';
  }

  if (
    permissionSet.has(PERMISSION_GROUPS.CITY_REQUEST.MANAGE) ||
    permissionSet.has(PERMISSION_GROUPS.ALERT.MANAGE) ||
    permissionSet.has(PERMISSION_GROUPS.NEWS.MANAGE)
  ) {
    return 'municipality';
  }

  if (permissions.length > 0) {
    return 'citizen';
  }

  return null;
};
