import type {
  AnalyticsQuery,
  AnalyticsSection,
  RequestsGeo,
} from '@/features/analytics/analytics.types';
import { apiClient } from '..';
import { API_ROUTES } from '../routes';

const buildAnalyticsQuery = (query?: AnalyticsQuery): string => {
  if (!query) return '';

  const params = new URLSearchParams();
  if (query.granularity) params.set('granularity', query.granularity);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const analyticsApi = {
  getCityRequests: (cityId: string, query?: AnalyticsQuery) =>
    apiClient.get<AnalyticsSection>(
      `${API_ROUTES.analytics.cityRequests(cityId)}${buildAnalyticsQuery(query)}`,
    ),

  getCitySurveys: (cityId: string, query?: AnalyticsQuery) =>
    apiClient.get<AnalyticsSection>(
      `${API_ROUTES.analytics.citySurveys(cityId)}${buildAnalyticsQuery(query)}`,
    ),

  getCityAlerts: (cityId: string, query?: AnalyticsQuery) =>
    apiClient.get<AnalyticsSection>(
      `${API_ROUTES.analytics.cityAlerts(cityId)}${buildAnalyticsQuery(query)}`,
    ),

  getCityRequestsGeo: (cityId: string) =>
    apiClient.get<RequestsGeo>(API_ROUTES.analytics.cityRequestsGeo(cityId)),

  getSystemOverview: (query?: AnalyticsQuery) =>
    apiClient.get<AnalyticsSection>(
      `${API_ROUTES.analytics.systemOverview}${buildAnalyticsQuery(query)}`,
    ),
};
