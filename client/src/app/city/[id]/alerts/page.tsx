import AlertsList from './_components/AlertsList';

export default async function CityAlertsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <h2>Оголошення</h2>
      <AlertsList cityId={id} />
    </>
  );
}
