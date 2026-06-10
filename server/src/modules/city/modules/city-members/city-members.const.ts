export const CITY_MEMBERS_ERRORS = {
  MEMBER_NOT_FOUND: 'City member not found',
  ROLE_NOT_FOUND: 'Role not found for city',
  LAST_ADMIN_PROTECTION: 'Cannot remove admin role from the last city admin',
  SELF_LAST_ADMIN_PROTECTION:
    'You cannot remove your own admin role while you are the last city admin',
  SELF_BLOCK_PROTECTION: 'You cannot block yourself',
  ADMIN_BLOCK_PROTECTION: 'City admins cannot be blocked',
  LAST_ADMIN_BLOCK_PROTECTION: 'Cannot block the last active city admin',
} as const;
