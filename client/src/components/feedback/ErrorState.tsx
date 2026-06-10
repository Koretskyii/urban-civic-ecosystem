'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  reset: () => void;
  title?: string;
}

export function ErrorState({ reset, title }: ErrorStateProps) {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-base text-[var(--danger-dark)]">
        {title ?? t('errorTitle')}
      </p>
      <Button type="button" onClick={reset}>
        {t('errorRetry')}
      </Button>
    </div>
  );
}
