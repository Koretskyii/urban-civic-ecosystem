import CityHomeView from './_components/CityHomeView';

interface CityPageProps {
  params: { id: string };
}

export default async function CityPage(props: CityPageProps) {
  const { id } = props.params;

  return <CityHomeView cityId={id} />;
}
