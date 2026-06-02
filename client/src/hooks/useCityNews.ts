import { queryKeys } from '@/api';
import { cityNewsApi } from '@/api/endpoints/city-news.api';
import { CreateNewsPayload, NewsListQuery, UpdateNewsPayload } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const invalidateNewsQueries = async (
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

export function useCityNews(cityId: string, query?: NewsListQuery) {
  return useQuery({
    queryKey: queryKeys.news.list(cityId, query),
    queryFn: () => cityNewsApi.getCityNews(cityId, query),
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
    }) => cityNewsApi.createCityNews(cityId, payload),
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
    }) => cityNewsApi.updateCityNews(cityId, newsId, payload),
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
      cityNewsApi.deleteCityNews(cityId, newsId),
    onSuccess: async (_data, variables) => {
      await invalidateNewsQueries(
        queryClient,
        variables.cityId,
        variables.newsId,
      );
    },
  });
}
