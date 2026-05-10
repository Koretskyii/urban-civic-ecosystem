import NewsGrid from './_components/NewsGrid';

interface CityNewsPageProps {
  params: { id: string };
}

export default async function CityNewsPage(props: CityNewsPageProps) {
  const { id } = props.params;

  return <NewsGrid cityId={id} />;
}
