import { notFound } from 'next/navigation';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '@/api';
import { API_ROUTES } from '@/api/routes';
import { serverApiFetch, ServerFetchError } from '@/api/server';
import type { Survey } from '@/types';
import SurveyDetailView from './_components/SurveyDetailView';

interface SurveyDetailPageProps {
  params: Promise<{ id: string; surveyId: string }>;
}

export default async function SurveyDetailPage({
  params,
}: SurveyDetailPageProps) {
  const { id: cityId, surveyId } = await params;

  const queryClient = new QueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.surveys.detail(cityId, surveyId),
      queryFn: () =>
        serverApiFetch<Survey>(API_ROUTES.surveys.detail(cityId, surveyId)),
    });
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SurveyDetailView cityId={cityId} surveyId={surveyId} />
    </HydrationBoundary>
  );
}
