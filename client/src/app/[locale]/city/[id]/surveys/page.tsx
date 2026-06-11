import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api';
import { buildSurveysListPath } from '@/api/endpoints/city-surveys.api';
import { serverApiFetch } from '@/api/server';
import type { PaginatedResponse, Survey, SurveyListQuery } from '@/types';
import SurveysList from './_components/SurveysList';

interface CitySurveysPageProps {
  params: Promise<{ id: string }>;
}

const INITIAL_SURVEYS_QUERY: SurveyListQuery = {
  limit: 40,
  includeDeleted: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default async function CitySurveysPage({ params }: CitySurveysPageProps) {
  const { id: cityId } = await params;

  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.surveys.list(cityId, INITIAL_SURVEYS_QUERY),
    queryFn: () =>
      serverApiFetch<PaginatedResponse<Survey>>(
        buildSurveysListPath(cityId, INITIAL_SURVEYS_QUERY),
      ),
    initialPageParam: undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SurveysList cityId={cityId} />
    </HydrationBoundary>
  );
}
