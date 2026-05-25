import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cityApi } from '@/api/endpoints/city.api';
import { queryKeys } from '@/api/queryKeys';
import {
  City,
  NewsListQuery,
  CreateNewsPayload,
  UpdateNewsPayload,
} from '@/types';

const invalidateNewsQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  cityId: string,
  newsId?: string,
) => {
  const tasks: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({
      queryKey: queryKeys.news.all(cityId),
    }),
  ];

  if (newsId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: queryKeys.news.detail(cityId, newsId),
      }),
    );
  }

  await Promise.all(tasks);
};

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

export function useJoinCity() {
  return useMutation({
    mutationFn: (id: string) => cityApi.joinCity(id),
  });
}

export function useCityAlerts(cityId: string) {
  return useQuery({
    queryKey: queryKeys.alerts.all(cityId),
    queryFn: () => cityApi.getCityAlerts(cityId),
    enabled: !!cityId,
  });
}

export function useCityNews(cityId: string, query?: NewsListQuery) {
  return useQuery({
    queryKey: queryKeys.news.list(cityId, query),
    queryFn: () => cityApi.getCityNews(cityId, query),
    enabled: !!cityId,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      payload,
    }: {
      cityId: string;
      payload: CreateNewsPayload;
    }) => cityApi.createCityNews(cityId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateNewsQueries(queryClient, variables.cityId);
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      newsId,
      payload,
    }: {
      cityId: string;
      newsId: string;
      payload: UpdateNewsPayload;
    }) => cityApi.updateCityNews(cityId, newsId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateNewsQueries(
        queryClient,
        variables.cityId,
        variables.newsId,
      );
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, newsId }: { cityId: string; newsId: string }) =>
      cityApi.deleteCityNews(cityId, newsId),
    onSuccess: async (_data, variables) => {
      await invalidateNewsQueries(
        queryClient,
        variables.cityId,
        variables.newsId,
      );
    },
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
