import { apiClient } from '@/api/client';
import { API_ROUTES } from '@/api/routes';
import type {
  CreateDepartmentPayload,
  Department,
  UpdateDepartmentPayload,
} from '@/types';

export const cityDepartmentsApi = {
  getDepartments: (cityId: string) =>
    apiClient.get<Department[]>(API_ROUTES.departments.all(cityId)),

  createDepartment: (cityId: string, payload: CreateDepartmentPayload) =>
    apiClient.post<Department>(API_ROUTES.departments.all(cityId), payload),

  updateDepartment: (
    cityId: string,
    departmentId: string,
    payload: UpdateDepartmentPayload,
  ) =>
    apiClient.patch<Department>(
      API_ROUTES.departments.detail(cityId, departmentId),
      payload,
    ),

  deleteDepartment: (cityId: string, departmentId: string) =>
    apiClient.delete<Department>(
      API_ROUTES.departments.detail(cityId, departmentId),
    ),
};
