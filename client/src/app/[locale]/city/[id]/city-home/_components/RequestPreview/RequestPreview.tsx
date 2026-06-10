'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CITY_REQUEST_STATUS_BADGE_VARIANT } from '@/features/city-requests';
import type { RequestPreviewProps } from '../../types/CityHomeView.types';

export function RequestPreview({
  item,
  dateFormatter,
  onOpen,
}: RequestPreviewProps) {
  const t = useTranslations();

  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="w-full rounded-lg border border-black/10 bg-white p-3 text-left transition hover:border-[var(--secondary)]/40 hover:bg-[var(--secondary)]/5"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant={CITY_REQUEST_STATUS_BADGE_VARIANT[item.status]}>
          {t(`cityHome.requests.status.${item.status}`)}
        </Badge>
        <span className="text-xs text-[var(--muted-foreground)]">
          {dateFormatter.format(new Date(item.createdAt))}
        </span>
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold text-[var(--primary)]">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs text-[var(--muted-foreground)]">
        {item.address || item.user.name}
      </p>
    </button>
  );
}
