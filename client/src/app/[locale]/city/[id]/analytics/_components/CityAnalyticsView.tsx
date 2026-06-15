'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useCityAlertsAnalytics,
  useCityRequestsAnalytics,
  useCitySurveysAnalytics,
} from '@/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AnalyticsSectionView,
  GranularitySwitcher,
  type AnalyticsGranularity,
} from '@/features/analytics';
import { RequestsHeatmapCard } from './RequestsHeatmapCard';

type Section = 'requests' | 'surveys' | 'alerts';

interface CityAnalyticsViewProps {
  cityId: string;
}

export default function CityAnalyticsView({ cityId }: CityAnalyticsViewProps) {
  const t = useTranslations('analytics');
  const [section, setSection] = useState<Section>('requests');
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('month');

  const query = { granularity };
  const requests = useCityRequestsAnalytics(cityId, query, {
    enabled: section === 'requests',
  });
  const surveys = useCitySurveysAnalytics(cityId, query, {
    enabled: section === 'surveys',
  });
  const alerts = useCityAlertsAnalytics(cityId, query, {
    enabled: section === 'alerts',
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--primary)]">
          {t('cityTitle')}
        </h1>
        <GranularitySwitcher value={granularity} onChange={setGranularity} />
      </header>

      <Tabs
        value={section}
        onValueChange={(value) => setSection(value as Section)}
      >
        <TabsList>
          <TabsTrigger value="requests">{t('tabs.requests')}</TabsTrigger>
          <TabsTrigger value="surveys">{t('tabs.surveys')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('tabs.alerts')}</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <div className="flex flex-col gap-4">
            <AnalyticsSectionView
              section={requests.data}
              isLoading={requests.isLoading}
              isError={requests.isError}
            />
            <RequestsHeatmapCard
              cityId={cityId}
              enabled={section === 'requests'}
            />
          </div>
        </TabsContent>
        <TabsContent value="surveys" className="mt-4">
          <AnalyticsSectionView
            section={surveys.data}
            isLoading={surveys.isLoading}
            isError={surveys.isError}
          />
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <AnalyticsSectionView
            section={alerts.data}
            isLoading={alerts.isLoading}
            isError={alerts.isError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
