import CityAnalyticsView from './_components/CityAnalyticsView';

interface CityAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityAnalyticsPage({
  params,
}: CityAnalyticsPageProps) {
  const { id: cityId } = await params;

  return <CityAnalyticsView cityId={cityId} />;
}
