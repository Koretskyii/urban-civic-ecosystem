import CityHomeView from './_components/CityHomeView';

interface CityPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityPage(props: CityPageProps) {
  const { id } = await props.params;

  return <CityHomeView cityId={id} />;
}
