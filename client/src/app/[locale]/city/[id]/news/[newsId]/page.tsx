import NewsDetailView from './_components/NewsDetailView';

interface NewsDetailPageProps {
  params: Promise<{ id: string; newsId: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id: cityId, newsId } = await params;

  return <NewsDetailView cityId={cityId} newsId={newsId} />;
}
