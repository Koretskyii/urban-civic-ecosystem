import { apiClient } from '../client';
import { API_ROUTES } from '../routes';
import type {
  AssignDepartmentPayload,
  CreateCityRequestPayload,
  CreateMessagePayload,
  CreateReportPayload,
  UpdateStatusPayload,
} from '@/features/city-requests';
import type {
  CityRequestDetail,
  CityRequestListItem,
  CityRequestMessage,
  CityRequestReport,
  Department,
  GetCityRequestsQuery,
  PaginatedResponse,
} from '@/types';

function buildListQuery(query?: GetCityRequestsQuery) {
  if (!query) return '';

  const params = new URLSearchParams();

  if (query.scope) params.set('scope', query.scope);
  if (query.status) params.set('status', query.status);
  if (query.departmentId) params.set('departmentId', query.departmentId);
  if (query.priority !== undefined)
    params.set('priority', String(query.priority));
  if (query.search) params.set('search', query.search);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const cityRequestsApi = {
  createRequest: (cityId: string, formData: FormData) =>
    apiClient.postFormData<CityRequestDetail>(
      API_ROUTES.cityRequests.all(cityId),
      formData,
    ),

  getRequests: (cityId: string, query?: GetCityRequestsQuery) =>
    apiClient.get<PaginatedResponse<CityRequestListItem>>(
      `${API_ROUTES.cityRequests.all(cityId)}${buildListQuery(query)}`,
    ),

  getRequestDetail: (cityId: string, requestId: string) =>
    apiClient.get<CityRequestDetail>(
      API_ROUTES.cityRequests.detail(cityId, requestId),
    ),

  assignDepartment: (
    cityId: string,
    requestId: string,
    payload: AssignDepartmentPayload,
  ) =>
    apiClient.patch<CityRequestDetail>(
      API_ROUTES.cityRequests.assign(cityId, requestId),
      payload,
    ),

  updateStatus: (
    cityId: string,
    requestId: string,
    payload: UpdateStatusPayload,
  ) =>
    apiClient.patch<CityRequestDetail>(
      API_ROUTES.cityRequests.status(cityId, requestId),
      payload,
    ),

  createReport: (cityId: string, requestId: string, formData: FormData) =>
    apiClient.postFormData<CityRequestReport>(
      API_ROUTES.cityRequests.reports(cityId, requestId),
      formData,
    ),

  getDepartments: (cityId: string) =>
    apiClient.get<Department[]>(API_ROUTES.departments.all(cityId)),

  createMessage: (
    cityId: string,
    requestId: string,
    payload: CreateMessagePayload,
  ) =>
    apiClient.post<CityRequestMessage>(
      API_ROUTES.cityRequests.messages(cityId, requestId),
      payload,
    ),

  getMessages: (cityId: string, requestId: string) =>
    apiClient.get<CityRequestMessage[]>(
      API_ROUTES.cityRequests.messages(cityId, requestId),
    ),

  buildCreateRequestFormData: (
    payload: CreateCityRequestPayload,
    files: File[] = [],
  ) => {
    const formData = new FormData();

    formData.set('title', payload.title);
    formData.set('locationLat', String(payload.locationLat));
    formData.set('locationLng', String(payload.locationLng));

    if (payload.description) formData.set('description', payload.description);
    if (payload.category) formData.set('category', payload.category);
    if (payload.priority !== undefined)
      formData.set('priority', String(payload.priority));
    if (payload.address) formData.set('address', payload.address);
    if (payload.location) formData.set('location', payload.location);

    files.forEach((file) => formData.append('files', file));

    return formData;
  },

  buildCreateReportFormData: (
    payload: CreateReportPayload,
    files: File[] = [],
  ) => {
    const formData = new FormData();

    formData.set('type', payload.type);
    if (payload.status) formData.set('status', payload.status);
    if (payload.description) formData.set('description', payload.description);

    files.forEach((file) => formData.append('files', file));

    return formData;
  },
};
