'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { ALERT_SEVERITY_BADGE_VARIANT } from '../../../alerts/alerts.constants';
import { truncate } from '../../helpers/truncate';
import type { AlertPreviewProps } from '../../types/CityHomeView.types';

export function AlertPreview({ item, onOpen }: AlertPreviewProps) {
  const t = useTranslations();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-lg border border-black/10 bg-white p-3 text-left transition hover:border-[var(--warning)]/50 hover:bg-[var(--warning)]/8"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant={ALERT_SEVERITY_BADGE_VARIANT[item.severity]}>
          {t(`alerts.severity.${item.severity}`)}
        </Badge>
        <span className="text-xs text-[var(--muted-foreground)]">
          {item.alertType.name}
        </span>
      </div>
      <h3 className="line-clamp-1 text-sm font-semibold text-[var(--primary)]">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
        {truncate(item.content, 90)}
      </p>
    </button>
  );
}
