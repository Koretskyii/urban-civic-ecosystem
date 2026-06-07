'use client';

import { useTranslations } from 'next-intl';
import { CityCreationRequestTracker } from './sections/CityCreationRequestTracker/CityCreationRequestTracker';
import { CityInitForm } from './sections/CityInitForm/CityInitForm';
import { useCurrentCityCreationRequest } from '@/hooks';

export function CityCreateView() {
  const t = useTranslations();
  const requestQuery = useCurrentCityCreationRequest();
  const request = requestQuery.data;

  if (request?.status === 'PENDING') {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <CityCreationRequestTracker request={request} />
        <p className="rounded-md border border-black/10 bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
          {t('cityInit.pendingRequestBlocksCreation')}
        </p>
      </div>
    );
  }

  if (request) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-stretch">
        <CityInitForm />
        <CityCreationRequestTracker request={request} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <CityInitForm />
    </div>
  );
}
