import AlertDetailView from './_components/AlertDetailView/AlertDetailView';

interface AlertDetailPageProps {
  params: Promise<{ id: string; alertId: string }>;
}

export default async function AlertDetailPage({
  params,
}: AlertDetailPageProps) {
  const { id: cityId, alertId } = await params;

  return <AlertDetailView cityId={cityId} alertId={alertId} />;
}
