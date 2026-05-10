import { getTranslations } from 'next-intl/server';

export default async function CityProjectsPage() {
  const t = await getTranslations();

  return <h2>{t('cityPages.projectsComingSoon')}</h2>;
}
