import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { buildRequestsListPath } from '@/api/endpoints/city-requests.api';
import { serverApiFetch } from '@/api/server';
import type {
  CityRequestListItem,
  GetCityRequestsQuery,
  PaginatedResponse,
} from '@/types';
import ProblemWorkspace from './_components/ProblemWorkspace';

interface CityProblemPageProps {
  params: Promise<{ id: string }>;
}

// Mirrors ProblemWorkspace's initial requestListQuery + the hook's forced limit.
const INITIAL_REQUESTS_QUERY: GetCityRequestsQuery = {
  scope: 'all',
  limit: 40,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default async function CityProblemPage({
  params,
}: CityProblemPageProps) {
  const { id: cityId } = await params;

  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.cityRequests.list(cityId, INITIAL_REQUESTS_QUERY),
    queryFn: () =>
      serverApiFetch<PaginatedResponse<CityRequestListItem>>(
        buildRequestsListPath(cityId, INITIAL_REQUESTS_QUERY),
      ),
    initialPageParam: undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProblemWorkspace cityId={cityId} />
    </HydrationBoundary>
  );
}
