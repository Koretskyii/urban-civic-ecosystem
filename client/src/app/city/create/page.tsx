import { CityInitForm } from '../components/CityInitForm';
import { createTranslator } from 'next-intl';
import { uk } from '@/i18n/uk';

export default function CreateCityPage() {
  const t = createTranslator({ locale: 'uk', messages: uk });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">{t('cityCreate.title')}</h1>
      <CityInitForm />
    </div>
  );
}
