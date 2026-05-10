import AlertsList from './_components/AlertsList';
import { createTranslator } from 'next-intl';
import { uk } from '@/i18n/uk';

interface CityAlertsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityAlertsPage(props: CityAlertsPageProps) {
  const { id } = await props.params;
  const t = createTranslator({ locale: 'uk', messages: uk });

  return (
    <>
      <h2>{t('cityPages.alertsTitle')}</h2>
      <AlertsList cityId={id} />
    </>
  );
}
