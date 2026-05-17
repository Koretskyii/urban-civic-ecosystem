import type { PermissionKey } from '@/types/rbac.types';

// ─── Grouped Permissions ───
export const PERMISSION_GROUPS = {
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

  PROJECT: {
    CREATE: 'project:create' as PermissionKey,
    UPDATE: 'project:update' as PermissionKey,
    DELETE: 'project:delete' as PermissionKey,
    MANAGE: 'project:manage' as PermissionKey,
  },

  COMMUNITY: {
    CREATE: 'community:create' as PermissionKey,
    UPDATE: 'community:update' as PermissionKey,
    DELETE: 'community:delete' as PermissionKey,
    MANAGE: 'community:manage' as PermissionKey,
  },

  POST: {
    CREATE: 'post:create' as PermissionKey,
    UPDATE: 'post:update' as PermissionKey,
    DELETE: 'post:delete' as PermissionKey,
    MANAGE: 'post:manage' as PermissionKey,
  },

  COMMENT: {
    CREATE: 'comment:create' as PermissionKey,
    UPDATE: 'comment:update' as PermissionKey,
    DELETE: 'comment:delete' as PermissionKey,
    MANAGE: 'comment:manage' as PermissionKey,
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

  REACTION: {
    CREATE: 'reaction:create' as PermissionKey,
    UPDATE: 'reaction:update' as PermissionKey,
    DELETE: 'reaction:delete' as PermissionKey,
    MANAGE: 'reaction:manage' as PermissionKey,
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

  CROWDFUNDING: {
    CREATE: 'crowdfunding_project:create' as PermissionKey,
    UPDATE: 'crowdfunding_project:update' as PermissionKey,
    DELETE: 'crowdfunding_project:delete' as PermissionKey,
    MANAGE: 'crowdfunding_project:manage' as PermissionKey,
  },

  DONATION: {
    CREATE: 'donation:create' as PermissionKey,
    UPDATE: 'donation:update' as PermissionKey,
    DELETE: 'donation:delete' as PermissionKey,
    MANAGE: 'donation:manage' as PermissionKey,
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
  canCreateProject: [PERMISSION_GROUPS.PROJECT.CREATE] as const,
  canManageProject: [PERMISSION_GROUPS.PROJECT.MANAGE] as const,
  canCreatePost: [PERMISSION_GROUPS.POST.CREATE] as const,
  canManagePost: [PERMISSION_GROUPS.POST.MANAGE] as const,
  canManageRole: [PERMISSION_GROUPS.ROLE.MANAGE] as const,
  canManageCommunity: [PERMISSION_GROUPS.COMMUNITY.MANAGE] as const,
} as const;
