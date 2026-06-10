import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { buildNewsListPath } from '@/api/endpoints/city-news.api';
import { serverApiFetch } from '@/api/server';
import type { News, NewsListQuery, PaginatedResponse } from '@/types';
import NewsGrid from './_components/NewsGrid';

interface CityNewsPageProps {
  params: Promise<{ id: string }>;
}

// Mirrors NewsGrid's initial listQuery + useInfiniteCityNews's forced limit.
// On drift the prefetch key simply won't match and the client fetches as
// before — never a breakage, only a missed first-paint optimization.
const INITIAL_NEWS_QUERY: NewsListQuery = {
  limit: 40,
  includeDeleted: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default async function CityNewsPage({ params }: CityNewsPageProps) {
  const { id: cityId } = await params;

  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.news.list(cityId, INITIAL_NEWS_QUERY),
    queryFn: () =>
      serverApiFetch<PaginatedResponse<News>>(
        buildNewsListPath(cityId, INITIAL_NEWS_QUERY),
      ),
    initialPageParam: undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NewsGrid cityId={cityId} />
    </HydrationBoundary>
  );
}
