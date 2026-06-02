'use client';

import { addDaysToDateTimeInput } from '../alerts.utils';

interface AlertExpiryQuickActionsProps {
  value: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
}

export default function AlertExpiryQuickActions({
  value,
  onChange,
  t,
}: AlertExpiryQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(addDaysToDateTimeInput(value, 7))}
        className="rounded-md border border-black/15 px-2 py-1 text-xs"
      >
        {t('alerts.actions.plus7Days')}
      </button>
      <button
        type="button"
        onClick={() => onChange(addDaysToDateTimeInput(value, 30))}
        className="rounded-md border border-black/15 px-2 py-1 text-xs"
      >
        {t('alerts.actions.plus30Days')}
      </button>
      <button
        type="button"
        onClick={() => onChange('')}
        className={`rounded-md px-2 py-1 text-xs ${
          value ? 'border border-black/15' : 'bg-[var(--primary)] text-white'
        }`}
      >
        {t('alerts.actions.noExpiry')}
      </button>
      <button
        type="button"
        onClick={() => onChange('')}
        className="rounded-md border border-black/15 px-2 py-1 text-xs"
      >
        {t('alerts.actions.clearExpiry')}
      </button>
    </div>
  );
}
