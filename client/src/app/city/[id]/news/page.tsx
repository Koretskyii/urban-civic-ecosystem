import NewsGrid from './_components/NewsGrid';

interface CityNewsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityNewsPage(props: CityNewsPageProps) {
  const { id } = await props.params;

  return <NewsGrid cityId={id} />;
}
