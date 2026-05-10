import { CityInitForm } from '../components/CityInitForm';
import { getTranslations } from 'next-intl/server';

export default async function CreateCityPage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">{t('cityCreate.title')}</h1>
      <CityInitForm />
    </div>
  );
}
