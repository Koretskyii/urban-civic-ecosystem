import {
  Alert,
  AlertListQuery,
  AlertType,
  CreateAlertPayload,
  PaginatedResponse,
  UpdateAlertPayload,
} from '@/types';
import { apiClient } from '..';
import { API_ROUTES } from '../routes';

const buildAlertsQuery = (query?: AlertListQuery) => {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();
  if (query.includeDeleted !== undefined) {
    params.set('includeDeleted', String(query.includeDeleted));
  }
  if (query.onlyActive !== undefined) {
    params.set('onlyActive', String(query.onlyActive));
  }
  if (query.search) {
    params.set('search', query.search);
  }
  if (query.severity) {
    params.set('severity', query.severity);
  }
  if (query.alertTypeId) {
    params.set('alertTypeId', query.alertTypeId);
  }
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.sortBy) {
    params.set('sortBy', query.sortBy);
  }
  if (query.sortOrder) {
    params.set('sortOrder', query.sortOrder);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const buildAlertsListPath = (cityId: string, query?: AlertListQuery) =>
  `${API_ROUTES.alerts.all(cityId)}${buildAlertsQuery(query)}`;

export const cityAlertsApi = {
  getCityAlerts: (cityId: string, query?: AlertListQuery) => {
    return apiClient.get<PaginatedResponse<Alert>>(
      buildAlertsListPath(cityId, query),
    );
  },
  getCityAlertById: (cityId: string, alertId: string) => {
    return apiClient.get<Alert>(API_ROUTES.alerts.detail(cityId, alertId));
  },
  getCityAlertTypes: (cityId: string) => {
    return apiClient.get<AlertType[]>(API_ROUTES.alerts.types(cityId));
  },
  createCityAlert: (cityId: string, payload: CreateAlertPayload) => {
    return apiClient.post<Alert>(API_ROUTES.alerts.all(cityId), payload);
  },
  updateCityAlert: (
    cityId: string,
    alertId: string,
    payload: UpdateAlertPayload,
  ) => {
    return apiClient.patch<Alert>(
      API_ROUTES.alerts.detail(cityId, alertId),
      payload,
    );
  },
  deleteCityAlert: (cityId: string, alertId: string) => {
    return apiClient.delete<{ success: boolean; deleted: boolean }>(
      API_ROUTES.alerts.detail(cityId, alertId),
    );
  },
};
