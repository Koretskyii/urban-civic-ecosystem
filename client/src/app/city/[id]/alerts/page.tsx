import AlertsList from './_components/AlertsList';

interface CityAlertsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityAlertsPage(props: CityAlertsPageProps) {
  const { id } = await props.params;

  return (
    <>
      <h2>Оголошення</h2>
      <AlertsList cityId={id} />
    </>
  );
}
