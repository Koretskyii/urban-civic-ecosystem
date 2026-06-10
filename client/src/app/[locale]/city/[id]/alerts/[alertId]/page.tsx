import { notFound } from 'next/navigation';
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { API_ROUTES } from '@/api/routes';
import { serverApiFetch, ServerFetchError } from '@/api/server';
import type { Alert } from '@/types';
import AlertDetailView from './_components/AlertDetailView/AlertDetailView';

interface AlertDetailPageProps {
  params: Promise<{ id: string; alertId: string }>;
}

export default async function AlertDetailPage({
  params,
}: AlertDetailPageProps) {
  const { id: cityId, alertId } = await params;

  const queryClient = new QueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.alerts.detail(cityId, alertId),
      queryFn: () =>
        serverApiFetch<Alert>(API_ROUTES.alerts.detail(cityId, alertId)),
    });
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AlertDetailView cityId={cityId} alertId={alertId} />
    </HydrationBoundary>
  );
}
