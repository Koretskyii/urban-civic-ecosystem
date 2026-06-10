import { getTranslations } from 'next-intl/server';
import { Spinner } from '@/components/feedback/Spinner';

export default async function Loading() {
  const t = await getTranslations('common');
  return <Spinner label={t('loading')} />;
}
