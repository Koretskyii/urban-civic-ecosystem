import AlertsList from './_components/AlertsList';
import { getTranslations } from 'next-intl/server';

interface CityAlertsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityAlertsPage(props: CityAlertsPageProps) {
  const { id } = await props.params;
  const t = await getTranslations();

  return (
    <>
      <h2>{t('cityPages.alertsTitle')}</h2>
      <AlertsList cityId={id} />
    </>
  );
}
