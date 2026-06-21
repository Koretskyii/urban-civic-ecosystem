'use client';

import { memo, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { CityRequestListItem } from '@/types';
import { useVirtualizer } from '@tanstack/react-virtual';

interface RequestListPanelProps {
  requests: CityRequestListItem[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  viewMode: 'citizen' | 'municipality';
  activeRequestId: string;
  onSelect: (requestId: string) => void;
  onLoadMore: () => void;
}

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
  const t = useTranslations();

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
          {t(`cityProblem.statuses.${request.status}`)}
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
  const {
    requests,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    viewMode,
    activeRequestId,
    onSelect,
    onLoadMore,
  } = props;
  const t = useTranslations();
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Europe/Kyiv',
      }),
    [locale],
  );
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: requests.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (viewMode === 'municipality' ? 64 : 96),
    overscan: 8,
  });

  const title =
    viewMode === 'municipality'
      ? t('cityProblem.municipality.listTitle')
      : t('cityProblem.listTitle');

  if (viewMode === 'municipality') {
    return (
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-black/10 bg-white p-3">
        <h3 className="mb-2 text-xl">{title}</h3>

        {isLoading ? (
          <p className="text-sm">{t('cityProblem.loading')}</p>
        ) : requests.length === 0 ? (
          <p className="text-sm">{t('cityProblem.empty')}</p>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-md border border-black/10">
              <div className="flex h-full min-w-[760px] flex-col text-sm">
                <div className="grid grid-cols-[minmax(220px,1.4fr)_140px_110px_90px_150px_150px] bg-black/5 text-left text-xs uppercase text-[var(--muted-foreground)]">
                  <div className="px-3 py-2 font-semibold">
                    {t('cityProblem.municipality.table.title')}
                  </div>
                  <div className="px-3 py-2 font-semibold">
                    {t('cityProblem.municipality.table.citizen')}
                  </div>
                  <div className="px-3 py-2 font-semibold">
                    {t('cityProblem.municipality.table.status')}
                  </div>
                  <div className="px-3 py-2 font-semibold">
                    {t('cityProblem.municipality.table.priority')}
                  </div>
                  <div className="px-3 py-2 font-semibold">
                    {t('cityProblem.municipality.table.department')}
                  </div>
                  <div className="px-3 py-2 font-semibold">
                    {t('cityProblem.municipality.table.created')}
                  </div>
                </div>
                <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
                  <div
                    className="relative w-full"
                    style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const request = requests[virtualRow.index];
                      return (
                        <div
                          key={request.id}
                          ref={rowVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          className={`absolute left-0 top-0 grid w-full cursor-pointer grid-cols-[minmax(220px,1.4fr)_140px_110px_90px_150px_150px] border-t pb-2 transition-colors ${
                            request.id === activeRequestId
                              ? 'border-l-4 border-l-[var(--secondary)] border-t-[var(--secondary)]/30 bg-[var(--secondary)]/15 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]'
                              : 'border-black/10 bg-white hover:bg-black/[0.02]'
                          }`}
                          style={{
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          onClick={() => onSelect(request.id)}
                        >
                          <div className="max-w-[240px] px-3 py-2 font-medium">
                            <button
                              type="button"
                              className="line-clamp-2 text-left text-[var(--primary)] hover:underline"
                            >
                              {request.title}
                            </button>
                          </div>
                          <div className="px-3 py-2 text-[var(--muted-foreground)]">
                            {request.user.name}
                          </div>
                          <div className="px-3 py-2">
                            {t(`cityProblem.statuses.${request.status}`)}
                          </div>
                          <div className="px-3 py-2">{`P${request.priority}`}</div>
                          <div className="px-3 py-2">
                            {request.assignedDepartment?.name ?? '-'}
                          </div>
                          <div className="px-3 py-2 text-[var(--muted-foreground)]">
                            {dateFormatter.format(new Date(request.createdAt))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {hasNextPage ? (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                className="mt-2 text-sm text-[var(--primary-light)] disabled:opacity-60"
              >
                {isFetchingNextPage
                  ? t('common.processing')
                  : t('common.loadMore')}
              </button>
            ) : null}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[420px] flex-1 flex-col rounded-lg border border-black/10 bg-white p-3">
      <h3 className="mb-2 text-xl">{title}</h3>

      {isLoading ? (
        <p className="text-sm">{t('cityProblem.loading')}</p>
      ) : requests.length === 0 ? (
        <p className="text-sm">{t('cityProblem.empty')}</p>
      ) : (
        <>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto pr-1">
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const request = requests[virtualRow.index];
                return (
                  <div
                    key={request.id}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    className="absolute left-0 top-0 w-full pb-2"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <RequestRow
                      request={request}
                      isActive={request.id === activeRequestId}
                      onSelect={onSelect}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {hasNextPage ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
              className="mt-2 text-sm text-[var(--primary-light)] disabled:opacity-60"
            >
              {isFetchingNextPage
                ? t('common.processing')
                : t('common.loadMore')}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
});
