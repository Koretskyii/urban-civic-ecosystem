'use client';

import { useTranslations } from 'next-intl';
import type { CityCreationRequestTracking } from '@/types';
import { TrackingCard } from './TrackingCard/TrackingCard';

export function CityCreationRequestTracker({
  request,
}: {
  request: CityCreationRequestTracking;
}) {
  const t = useTranslations();

  return (
    <aside className="h-full space-y-4 rounded-md border border-black/10 bg-white p-4 lg:sticky lg:top-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--primary)]">
          {t('cityInit.trackingTitle')}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t('cityInit.trackingSubtitle')}
        </p>
      </div>

      <TrackingCard request={request} />
    </aside>
  );
}
