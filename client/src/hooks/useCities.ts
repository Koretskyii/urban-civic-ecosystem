import { useQuery } from '@tanstack/react-query';
import { cityApi } from '@/api/endpoints/city.api';
import { queryKeys } from '@/api/queryKeys';
import { City } from '@/types';

export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities.all(),
    queryFn: async () => {
      const response: City[] = await cityApi.getAllCities();
      return response;
    },
  });
}

export function useCityById(id: string) {
  return useQuery({
    queryKey: queryKeys.cities.detail(id),
    queryFn: () => cityApi.getCityById(id),
    enabled: !!id,
  });
}

export function useCityAlerts(cityId: string) {
  return useQuery({
    queryKey: queryKeys.alerts.all(cityId),
    queryFn: () => cityApi.getCityAlerts(cityId),
    enabled: !!cityId,
  });
}

export function useCityNews(cityId: string) {
  return useQuery({
    queryKey: queryKeys.news.all(cityId),
    queryFn: () => cityApi.getCityNews(cityId),
    enabled: !!cityId,
  });
}

export function useCityPosts(cityId: string) {
  return useQuery({
    queryKey: queryKeys.posts.all(cityId),
    queryFn: () => cityApi.getCityPosts(cityId),
    enabled: !!cityId,
  });
}

export function useCityCommunity(cityId: string) {
  return useQuery({
    queryKey: queryKeys.communities.all(cityId),
    queryFn: () => cityApi.getCityCommunity(cityId),
    enabled: !!cityId,
  });
}
