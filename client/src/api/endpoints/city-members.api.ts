import { apiClient } from '@/api/client';
import { API_ROUTES } from '@/api/routes';
import type { CityMember, RoleKey } from '@/types';

export const cityMembersApi = {
  getMembers: (cityId: string) => {
    return apiClient.get<CityMember[]>(API_ROUTES.cityMembers.all(cityId));
  },
  updateMemberRole: (cityId: string, userId: string, role: RoleKey) => {
    return apiClient.patch<{ userId: string; role: RoleKey }>(
      API_ROUTES.cityMembers.role(cityId, userId),
      { role },
    );
  },
};
