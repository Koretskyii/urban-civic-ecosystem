export type PermissionKey =
  // Cities
  | 'city:create'
  | 'city:update'
  | 'city:delete'
  | 'city:manage'

  // City Requests
  | 'city_request:create'
  | 'city_request:update'
  | 'city_request:delete'
  | 'city_request:manage'

  // Reports
  | 'report:create'
  | 'report:update'
  | 'report:delete'
  | 'report:manage'

  // Attachments
  | 'attachment:create'
  | 'attachment:update'
  | 'attachment:delete'
  | 'attachment:manage'

  // Chats
  | 'chat:create'
  | 'chat:update'
  | 'chat:delete'
  | 'chat:manage'

  // Messages
  | 'message:create'
  | 'message:update'
  | 'message:delete'
  | 'message:manage'

  // Alerts
  | 'alert:create'
  | 'alert:update'
  | 'alert:delete'
  | 'alert:manage'

  // Projects
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  | 'project:manage'

  // Community
  | 'community:create'
  | 'community:update'
  | 'community:delete'
  | 'community:manage'

  // Posts
  | 'post:create'
  | 'post:update'
  | 'post:delete'
  | 'post:manage'

  // Comments
  | 'comment:create'
  | 'comment:update'
  | 'comment:delete'
  | 'comment:manage'

  // Reactions
  | 'reaction:create'
  | 'reaction:update'
  | 'reaction:delete'
  | 'reaction:manage'

  // Surveys
  | 'survey:create'
  | 'survey:update'
  | 'survey:delete'
  | 'survey:manage'

  // Votes
  | 'vote:create'
  | 'vote:update'
  | 'vote:delete'
  | 'vote:manage'

  // Crowdfunding
  | 'crowdfunding_project:create'
  | 'crowdfunding_project:update'
  | 'crowdfunding_project:delete'
  | 'crowdfunding_project:manage'

  // Donations
  | 'donation:create'
  | 'donation:update'
  | 'donation:delete'
  | 'donation:manage'

  // News
  | 'news:create'
  | 'news:update'
  | 'news:delete'
  | 'news:manage'

  // Role management
  | 'role:create'
  | 'role:update'
  | 'role:delete'
  | 'role:manage'

  // User management
  | 'user:view_profile'
  | 'user:update_profile'
  | 'user:delete_profile'
  | 'user:manage_profile';

export type RoleKey = 'admin' | 'citizen' | 'organizer' | 'municipality';

export interface GetPermissionsResponse {
  permissions: PermissionKey[];
  role: RoleKey | null;
  isBlocked: boolean;
}
