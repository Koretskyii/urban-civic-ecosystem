import { createTranslator } from 'next-intl';
import { uk } from '@/i18n/uk';

export default function CityProblemPage() {
  const t = createTranslator({ locale: 'uk', messages: uk });

  return <h2>{t('cityPages.problemComingSoon')}</h2>;
}
