import CityHomeView from './city-home/CityHomeView';

interface CityPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityPage(props: CityPageProps) {
  const { id } = await props.params;

  return <CityHomeView cityId={id} />;
}
