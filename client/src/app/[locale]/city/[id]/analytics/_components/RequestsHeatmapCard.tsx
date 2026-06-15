'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useCityById, useCityRequestsGeo } from '@/hooks';
import { HEATMAP_HEIGHT } from '@/features/analytics/analytics.const';

const RequestsHeatmap = dynamic(
  () =>
    import('@/features/analytics/components/RequestsHeatmap').then(
      (module) => module.RequestsHeatmap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
        ...
      </div>
    ),
  },
);

interface RequestsHeatmapCardProps {
  cityId: string;
  enabled: boolean;
}

const isUsableCenter = (lat: unknown, lng: unknown): lat is number =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat !== 0 &&
  lng !== 0;

export function RequestsHeatmapCard({
  cityId,
  enabled,
}: RequestsHeatmapCardProps) {
  const t = useTranslations('analytics.heatmap');
  const { data, isLoading, isError } = useCityRequestsGeo(cityId, { enabled });
  const { data: city } = useCityById(cityId);

  const center = useMemo(
    () =>
      isUsableCenter(city?.centerLat, city?.centerLng)
        ? { lat: city.centerLat as number, lng: city.centerLng as number }
        : undefined,
    [city?.centerLat, city?.centerLng],
  );

  const points = data?.points ?? [];

  return (
    <div className="rounded-xl border border-[var(--secondary)]/15 bg-[var(--surface-1)] p-4">
      <h3 className="mb-1 text-sm font-semibold text-[var(--primary)]">
        {t('title')}
      </h3>
      <p className="mb-3 text-xs text-[var(--muted-foreground)]">
        {t('description')}
      </p>
      <div
        className="overflow-hidden rounded-lg border border-black/10"
        style={{ height: HEATMAP_HEIGHT }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
            {t('loading')}
          </div>
        ) : isError ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--danger)]">
            {t('error')}
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
            {t('empty')}
          </div>
        ) : (
          <RequestsHeatmap points={points} center={center} />
        )}
      </div>
    </div>
  );
}
