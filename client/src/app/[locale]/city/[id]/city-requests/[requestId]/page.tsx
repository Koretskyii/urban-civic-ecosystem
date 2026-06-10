import { notFound } from 'next/navigation';
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { API_ROUTES } from '@/api/routes';
import { serverApiFetch, ServerFetchError } from '@/api/server';
import type { CityRequestDetail } from '@/types';
import CityRequestDetailView from './_components/CityRequestDetailView';

interface CityRequestDetailPageProps {
  params: Promise<{ id: string; requestId: string }>;
}

export default async function CityRequestDetailPage({
  params,
}: CityRequestDetailPageProps) {
  const { id: cityId, requestId } = await params;

  const queryClient = new QueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.cityRequests.detail(cityId, requestId),
      queryFn: () =>
        serverApiFetch<CityRequestDetail>(
          API_ROUTES.cityRequests.detail(cityId, requestId),
        ),
    });
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CityRequestDetailView cityId={cityId} requestId={requestId} />
    </HydrationBoundary>
  );
}
