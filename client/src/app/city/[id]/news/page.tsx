import NewsGrid from './_components/NewsGrid';

export default async function CityNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <NewsGrid cityId={id} />;
}
