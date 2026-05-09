import CityHomeView from './_components/CityHomeView';

export default async function CityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CityHomeView cityId={id} />;
}
