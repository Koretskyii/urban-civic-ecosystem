import { CityInitForm } from '../components/CityInitForm';
import { getTranslations } from 'next-intl/server';

export default async function CreateCityPage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto py-10">
      <CityInitForm />
    </div>
  );
}
