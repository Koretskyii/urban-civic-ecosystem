import { notFound } from 'next/navigation';
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { API_ROUTES } from '@/api/routes';
import { serverApiFetch, ServerFetchError } from '@/api/server';
import type { News } from '@/types';
import NewsDetailView from './_components/NewsDetailView';

interface NewsDetailPageProps {
  params: Promise<{ id: string; newsId: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id: cityId, newsId } = await params;

  const queryClient = new QueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.news.detail(cityId, newsId),
      queryFn: () =>
        serverApiFetch<News>(API_ROUTES.news.detail(cityId, newsId)),
    });
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NewsDetailView cityId={cityId} newsId={newsId} />
    </HydrationBoundary>
  );
}
