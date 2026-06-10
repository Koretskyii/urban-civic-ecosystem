import { getTranslations } from 'next-intl/server';
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { buildAlertsListPath } from '@/api/endpoints/city-alerts.api';
import { serverApiFetch } from '@/api/server';
import type { Alert, AlertListQuery, PaginatedResponse } from '@/types';
import AlertsList from './_components/AlertsList';

interface CityAlertsPageProps {
  params: Promise<{ id: string }>;
}

// Mirrors AlertsList's initial citizen listQuery + the hook's forced limit.
const INITIAL_ALERTS_QUERY: AlertListQuery = {
  limit: 40,
  includeDeleted: false,
  onlyActive: false,
  sortBy: 'severity',
  sortOrder: 'asc',
};

export default async function CityAlertsPage({ params }: CityAlertsPageProps) {
  const { id: cityId } = await params;
  const t = await getTranslations();

  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.alerts.list(cityId, INITIAL_ALERTS_QUERY),
    queryFn: () =>
      serverApiFetch<PaginatedResponse<Alert>>(
        buildAlertsListPath(cityId, INITIAL_ALERTS_QUERY),
      ),
    initialPageParam: undefined,
  });

  return (
    <>
      <h2>{t('cityPages.alertsTitle')}</h2>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AlertsList cityId={cityId} />
      </HydrationBoundary>
    </>
  );
}
