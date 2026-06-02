'use client';

import { memo, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { CityRequestListItem } from '@/types';

interface RequestListPanelProps {
  requests: CityRequestListItem[];
  isLoading: boolean;
  viewMode: 'citizen' | 'municipality';
  activeRequestId: string;
  onSelect: (requestId: string) => void;
}

const INITIAL_BATCH_SIZE = 40;
const LOAD_MORE_STEP = 40;

interface RequestRowProps {
  request: CityRequestListItem;
  isActive: boolean;
  onSelect: (requestId: string) => void;
}

const RequestRow = memo(function RequestRow({
  request,
  isActive,
  onSelect,
}: RequestRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(request.id)}
      className={`w-full rounded-md border px-3 py-2 text-left ${
        isActive
          ? 'border-[var(--secondary)] bg-[var(--secondary)]/10'
          : 'border-black/10'
      }`}
    >
      <p className="text-sm font-semibold">{request.title}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        {request.user.name}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] text-white">
          {request.status}
        </span>
        <span className="rounded-full border border-black/20 px-2 py-0.5 text-[10px]">
          {`P${request.priority}`}
        </span>
        {request.assignedDepartment?.name ? (
          <span className="rounded-full border border-[var(--secondary)] px-2 py-0.5 text-[10px] text-[var(--secondary)]">
            {request.assignedDepartment.name}
          </span>
        ) : null}
      </div>
    </button>
  );
});

export const RequestListPanel = memo(function RequestListPanel(
  props: RequestListPanelProps,
) {
  const { requests, isLoading, viewMode, activeRequestId, onSelect } = props;
  const t = useTranslations();
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);

  const visibleRequests = useMemo(
    () => requests.slice(0, visibleCount),
    [requests, visibleCount],
  );
  const canLoadMore = visibleCount < requests.length;

  return (
    <div className="min-h-[420px] flex-1 rounded-lg border border-black/10 bg-white p-3">
      <h3 className="mb-2 text-xl">
        {viewMode === 'municipality'
          ? t('cityProblem.municipality.listTitle')
          : t('cityProblem.listTitle')}
      </h3>

      {isLoading ? (
        <p className="text-sm">{t('cityProblem.loading')}</p>
      ) : requests.length === 0 ? (
        <p className="text-sm">{t('cityProblem.empty')}</p>
      ) : (
        <>
          <div className="space-y-2">
            {visibleRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                isActive={request.id === activeRequestId}
                onSelect={onSelect}
              />
            ))}
          </div>
          {canLoadMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
              className="mt-2 text-sm text-[var(--primary-light)]"
            >
              {t('common.loadMore')}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
});
