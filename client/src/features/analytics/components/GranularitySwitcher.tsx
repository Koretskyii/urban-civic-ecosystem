'use client';

import { useTranslations } from 'next-intl';
import {
  ANALYTICS_GRANULARITIES,
  type AnalyticsGranularity,
} from '../analytics.types';

interface GranularitySwitcherProps {
  value: AnalyticsGranularity;
  onChange: (value: AnalyticsGranularity) => void;
}

export function GranularitySwitcher({
  value,
  onChange,
}: GranularitySwitcherProps) {
  const t = useTranslations('analytics.granularity');

  return (
    <div className="inline-flex items-center gap-1 rounded-md bg-black/5 p-1">
      {ANALYTICS_GRANULARITIES.map((granularity) => (
        <button
          key={granularity}
          type="button"
          onClick={() => onChange(granularity)}
          className={`rounded-sm px-3 py-1 text-sm transition-colors ${
            value === granularity
              ? 'bg-white font-medium text-[var(--secondary-dark)] shadow-sm'
              : 'text-[var(--primary-light)] hover:text-[var(--primary)]'
          }`}
        >
          {t(granularity)}
        </button>
      ))}
    </div>
  );
}
