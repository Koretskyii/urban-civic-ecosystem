import CityRequestDetailView from './_components/CityRequestDetailView';

interface CityRequestDetailPageProps {
  params: Promise<{ id: string; requestId: string }>;
}

export default async function CityRequestDetailPage({
  params,
}: CityRequestDetailPageProps) {
  const { id: cityId, requestId } = await params;

  return <CityRequestDetailView cityId={cityId} requestId={requestId} />;
}
