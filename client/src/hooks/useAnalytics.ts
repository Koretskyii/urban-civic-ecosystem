import { queryKeys } from '@/api';
import { analyticsApi } from '@/api/endpoints/analytics.api';
import type { AnalyticsQuery } from '@/features/analytics/analytics.types';
import { ANALYTICS_STALE_TIME_MS } from '@/features/analytics/analytics.const';
import { useQuery } from '@tanstack/react-query';

const STALE_TIME = ANALYTICS_STALE_TIME_MS;

export function useCityRequestsAnalytics(
  cityId: string,
  query?: AnalyticsQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.analytics.cityRequests(cityId, query),
    queryFn: () => analyticsApi.getCityRequests(cityId, query),
    enabled: (options?.enabled ?? true) && Boolean(cityId),
    staleTime: STALE_TIME,
  });
}

export function useCityRequestsGeo(
  cityId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.analytics.cityRequestsGeo(cityId),
    queryFn: () => analyticsApi.getCityRequestsGeo(cityId),
    enabled: (options?.enabled ?? true) && Boolean(cityId),
    staleTime: STALE_TIME,
  });
}

export function useCitySurveysAnalytics(
  cityId: string,
  query?: AnalyticsQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.analytics.citySurveys(cityId, query),
    queryFn: () => analyticsApi.getCitySurveys(cityId, query),
    enabled: (options?.enabled ?? true) && Boolean(cityId),
    staleTime: STALE_TIME,
  });
}

export function useCityAlertsAnalytics(
  cityId: string,
  query?: AnalyticsQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.analytics.cityAlerts(cityId, query),
    queryFn: () => analyticsApi.getCityAlerts(cityId, query),
    enabled: (options?.enabled ?? true) && Boolean(cityId),
    staleTime: STALE_TIME,
  });
}

export function useSystemAnalytics(
  query?: AnalyticsQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.analytics.systemOverview(query),
    queryFn: () => analyticsApi.getSystemOverview(query),
    enabled: options?.enabled ?? true,
    staleTime: STALE_TIME,
  });
}
