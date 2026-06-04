import { queryKeys } from '@/api';
import { cityNewsApi } from '@/api/endpoints/city-news.api';
import { CreateNewsPayload, NewsListQuery, UpdateNewsPayload } from '@/types';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

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

export function useCityNews(
  cityId: string,
  query?: NewsListQuery,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.news.list(cityId, query),
    queryFn: () => cityNewsApi.getCityNews(cityId, query),
    enabled: enabled && !!cityId,
    placeholderData: (previousData) => previousData,
    select: (page) => page.items,
  });
}

export function useInfiniteCityNews(
  cityId: string,
  query?: NewsListQuery,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const baseQuery = { limit: 40, ...query };

  return useInfiniteQuery({
    queryKey: queryKeys.news.list(cityId, baseQuery),
    queryFn: ({ pageParam }) =>
      cityNewsApi.getCityNews(cityId, {
        ...baseQuery,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && !!cityId,
  });
}

export function useCityNewsDetail(
  cityId: string,
  newsId: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.news.detail(cityId, newsId),
    queryFn: () => cityNewsApi.getCityNewsById(cityId, newsId),
    enabled: enabled && Boolean(cityId && newsId),
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      payload,
      files,
    }: {
      cityId: string;
      payload: CreateNewsPayload;
      files?: File[];
    }) => {
      const formData = cityNewsApi.buildCreateNewsFormData(payload, files);
      return cityNewsApi.createCityNews(cityId, formData);
    },
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
