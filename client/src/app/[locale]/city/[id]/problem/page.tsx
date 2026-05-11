import { getTranslations } from 'next-intl/server';

export default async function CityProblemPage() {
  const t = await getTranslations();

  return <h2>{t('cityPages.problemComingSoon')}</h2>;
}
