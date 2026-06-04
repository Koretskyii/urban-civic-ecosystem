'use client';

import { useResponsiveVirtualColumns } from '@/hooks';
import { DebouncedSearchInput } from '@/components';
import type { Alert, AlertSeverity } from '@/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { useTranslations } from 'next-intl';
import { useRef } from 'react';
import {
  ALERT_SEVERITY_FILTER_ALL,
  ALERT_SEVERITY_OPTIONS,
} from '../alerts.constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TranslationFn = ReturnType<typeof useTranslations>;

const ALERTS_GRID_BREAKPOINTS = [
  { minWidth: 1280, columns: 3 },
  { minWidth: 768, columns: 2 },
] as const;

interface CitizenAlertsViewProps {
  alerts: Alert[];
  search: string;
  severityFilter: typeof ALERT_SEVERITY_FILTER_ALL | AlertSeverity;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  t: TranslationFn;
  translateAlertTypeName: (name: string) => string;
  onSearchChange: (value: string) => void;
  onSeverityFilterChange: (
    value: typeof ALERT_SEVERITY_FILTER_ALL | AlertSeverity,
  ) => void;
  onOpenAlert: (alertId: string) => void;
  onLoadMore: () => void;
}

export function CitizenAlertsView(props: CitizenAlertsViewProps) {
  const {
    alerts,
    search,
    severityFilter,
    hasNextPage,
    isFetchingNextPage,
    t,
    translateAlertTypeName,
    onSearchChange,
    onSeverityFilterChange,
    onOpenAlert,
    onLoadMore,
  } = props;
  const columns = useResponsiveVirtualColumns(ALERTS_GRID_BREAKPOINTS, 1);
  const rowCount = Math.ceil(alerts.length / columns);
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 230,
    overscan: 5,
  });

  return (
    <>
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
        <DebouncedSearchInput
          value={search}
          onValueChange={onSearchChange}
          placeholder={t('alerts.searchPlaceholder')}
          className="h-10 flex-1 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
        />
        <Select
          value={severityFilter}
          onValueChange={(value) =>
            onSeverityFilterChange(
              value as typeof ALERT_SEVERITY_FILTER_ALL | AlertSeverity,
            )
          }
        >
          <SelectTrigger className="h-10 !w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALERT_SEVERITY_FILTER_ALL}>
              {t('alerts.filters.allSeverity')}
            </SelectItem>
            {ALERT_SEVERITY_OPTIONS.map((severity) => (
              <SelectItem key={severity} value={severity}>
                {t(`alerts.severity.${severity}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {alerts.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {t('alerts.empty')}
        </p>
      ) : (
        <>
          <div ref={scrollRef} className="max-h-[720px] overflow-auto pr-1">
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const rowItems = alerts.slice(
                  virtualRow.index * columns,
                  virtualRow.index * columns + columns,
                );

                return (
                  <div
                    key={virtualRow.key}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    className="absolute left-0 top-0 w-full pb-3"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div
                      className={
                        columns === 3
                          ? 'grid grid-cols-3 gap-3'
                          : columns === 2
                            ? 'grid grid-cols-2 gap-3'
                            : 'grid grid-cols-1 gap-3'
                      }
                    >
                      {rowItems.map((alert) => {
                        const date = new Date(alert.createdAt);
                        const formattedDate = date.toLocaleDateString('uk-UA', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        });
                        const formattedTime = date.toLocaleTimeString('uk-UA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <article
                            key={alert.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onOpenAlert(alert.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onOpenAlert(alert.id);
                              }
                            }}
                            className="flex min-h-[210px] flex-col rounded-xl border border-black/10 border-t-4 border-t-[var(--warning)] bg-[linear-gradient(180deg,rgba(255,186,8,0.08)_0%,#fff_38%)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(204,149,0,0.2)]"
                          >
                            <h3 className="mb-1 text-lg font-bold">
                              {alert.title}
                            </h3>
                            <p className="text-sm text-[var(--muted-foreground)]">
                              {translateAlertTypeName(alert.alertType.name)}
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)]">
                              {t(`alerts.severity.${alert.severity}`)} ·{' '}
                              {`${t('alerts.expiresAtLabel')}: ${
                                alert.expiresAt
                                  ? new Date(alert.expiresAt).toLocaleString(
                                      'uk-UA',
                                    )
                                  : t('alerts.noExpiry')
                              }`}
                            </p>
                            <p className="my-2 text-sm">{alert.content}</p>
                            <div className="my-1 h-px bg-black/10" />
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {formattedDate} · {formattedTime}
                            </p>
                          </article>
                        );
                      })}
                    </div>
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
              className="mt-3 rounded-md border border-[var(--warning-dark)]/30 px-3 py-2 text-sm text-[var(--warning-dark)] disabled:opacity-60"
            >
              {isFetchingNextPage
                ? t('common.processing')
                : t('common.loadMore')}
            </button>
          ) : null}
        </>
      )}
    </>
  );
}
