'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

interface NotFoundStateProps {
  title?: string;
}

export function NotFoundState({ title }: NotFoundStateProps) {
  const t = useTranslations('common');
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-base text-[var(--muted-foreground)]">
        {title ?? t('notFoundTitle')}
      </p>
      <Button type="button" variant="outline" onClick={() => router.back()}>
        {t('notFoundBack')}
      </Button>
    </div>
  );
}
