'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrentUser, useSystemAnalytics } from '@/hooks';
import {
  AnalyticsSectionView,
  GranularitySwitcher,
  type AnalyticsGranularity,
} from '@/features/analytics';

export default function AdminAnalyticsView() {
  const t = useTranslations('analytics');
  const tForbidden = useTranslations('forbidden');
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('month');

  const currentUser = useCurrentUser();
  const isAdmin = currentUser.data?.systemRole === 'ADMIN';

  const overview = useSystemAnalytics({ granularity }, { enabled: isAdmin });

  if (currentUser.isLoading) {
    return (
      <div className="p-4 text-sm text-[var(--muted-foreground)] md:p-6">
        {t('common.loading')}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <p className="m-4 rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)] md:m-6">
        {tForbidden('description')}
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--primary)]">
          {t('adminTitle')}
        </h1>
        <GranularitySwitcher value={granularity} onChange={setGranularity} />
      </header>

      <AnalyticsSectionView
        section={overview.data}
        isLoading={overview.isLoading}
        isError={overview.isError}
      />
    </div>
  );
}
