import type { SystemRole } from './auth.types';

export type CityCreationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
};

export type AdminAttachment = {
  id: string;
  fileName: string;
  mimeType?: string | null;
  url: string;
  type?: string | null;
  uploadedAt: string;
};

export type AdminCityCreationRequest = {
  id: string;
  name: string;
  region: string;
  centerLat?: number | null;
  centerLng?: number | null;
  domain?: string | null;
  status: CityCreationRequestStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester: AdminUserSummary;
  reviewedBy?: AdminUserSummary | null;
  attachments?: AdminAttachment[];
};

export type AdminCity = {
  id: string;
  name: string;
  region: string;
  centerLat?: number | null;
  centerLng?: number | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  cityDomain?: { domainName: string } | null;
  _count?: { users: number };
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  provider?: string;
  systemRole: SystemRole;
  createdAt: string;
  updatedAt: string;
  _count?: { memberships: number };
};

export type AdminPaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type AdminCityCreationRequestsQuery = {
  search?: string;
  status?: CityCreationRequestStatus;
  page?: number;
  limit?: number;
};

export type AdminCitiesQuery = {
  search?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
};

export type AdminUsersQuery = {
  search?: string;
  systemRole?: SystemRole;
  page?: number;
  limit?: number;
};

export type UpdateAdminCityPayload = {
  name?: string;
  region?: string;
  centerLat?: number;
  centerLng?: number;
  domain?: string;
};
