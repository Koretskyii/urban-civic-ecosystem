import { apiClient } from '@/api/client';
import { API_ROUTES } from '@/api/routes';
import type {
  CityMember,
  CityMembersListQuery,
  PaginatedResponse,
  RoleKey,
} from '@/types';

function buildMembersQuery(query?: CityMembersListQuery) {
  if (!query) return '';

  const params = new URLSearchParams();

  if (query.search) params.set('search', query.search);
  if (query.role) params.set('role', query.role);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const cityMembersApi = {
  getMembers: (cityId: string, query?: CityMembersListQuery) =>
    apiClient.get<PaginatedResponse<CityMember>>(
      `${API_ROUTES.cityMembers.all(cityId)}${buildMembersQuery(query)}`,
    ),
  updateMemberRole: (cityId: string, userId: string, role: RoleKey) => {
    return apiClient.patch<{ userId: string; role: RoleKey }>(
      API_ROUTES.cityMembers.role(cityId, userId),
      { role },
    );
  },
  updateMemberBlockStatus: (
    cityId: string,
    userId: string,
    isBlocked: boolean,
  ) => {
    return apiClient.patch<{
      userId: string;
      isBlocked: boolean;
      blockedAt?: string | null;
      blockedById?: string | null;
    }>(
      isBlocked
        ? API_ROUTES.cityMembers.block(cityId, userId)
        : API_ROUTES.cityMembers.unblock(cityId, userId),
      {},
    );
  },
};
