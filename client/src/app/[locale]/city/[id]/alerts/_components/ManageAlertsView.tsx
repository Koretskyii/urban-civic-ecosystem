'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { DebouncedSearchInput } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Alert, AlertSeverity, AlertType } from '@/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import {
  ALERT_SEVERITY_FILTER_ALL,
  ALERT_SEVERITY_OPTIONS,
} from '../alerts.constants';
import AlertExpiryQuickActions from './AlertExpiryQuickActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALERT_TYPE_PLACEHOLDER = '__alert_type_placeholder__';

type TranslationFn = ReturnType<typeof useTranslations>;

interface ManageAlertsViewProps {
  alerts: Alert[];
  alertTypes: AlertType[];
  search: string;
  includeDeleted: boolean;
  onlyActive: boolean;
  alertTypeId: string;
  severityFilter: typeof ALERT_SEVERITY_FILTER_ALL | AlertSeverity;
  sortBy: 'severity' | 'createdAt' | 'expiresAt' | 'title';
  sortOrder: 'asc' | 'desc';
  formError: string;
  newAlertTypeId: string;
  newSeverity: AlertSeverity;
  newExpiresAt: string;
  newTitle: string;
  newContent: string;
  canCreateAlert: boolean;
  canUpdateAlert: boolean;
  canDeleteAlert: boolean;
  canManageAlert: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  t: TranslationFn;
  translateAlertTypeName: (name: string) => string;
  onSearchChange: (value: string) => void;
  onIncludeDeletedChange: (value: boolean) => void;
  onOnlyActiveChange: (value: boolean) => void;
  onAlertTypeIdChange: (value: string) => void;
  onSeverityFilterChange: (
    value: typeof ALERT_SEVERITY_FILTER_ALL | AlertSeverity,
  ) => void;
  onSortByChange: (
    value: 'severity' | 'createdAt' | 'expiresAt' | 'title',
  ) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onNewAlertTypeIdChange: (value: string) => void;
  onNewSeverityChange: (value: AlertSeverity) => void;
  onNewExpiresAtChange: (value: string) => void;
  onNewTitleChange: (value: string) => void;
  onNewContentChange: (value: string) => void;
  onCreateAlert: (event: FormEvent<HTMLFormElement>) => void;
  onOpenAlert: (alertId: string) => void;
  onStartEdit: (item: {
    id: string;
    alertTypeId: string;
    severity: AlertSeverity;
    expiresAt?: string | null;
    title: string;
    content: string;
  }) => void;
  onDeleteAlert: (alertId: string) => void;
  onLoadMore: () => void;
}

export function ManageAlertsView(props: ManageAlertsViewProps) {
  const {
    alerts,
    alertTypes,
    search,
    includeDeleted,
    onlyActive,
    alertTypeId,
    severityFilter,
    sortBy,
    sortOrder,
    formError,
    newAlertTypeId,
    newSeverity,
    newExpiresAt,
    newTitle,
    newContent,
    canCreateAlert,
    canUpdateAlert,
    canDeleteAlert,
    canManageAlert,
    isCreating,
    isDeleting,
    hasNextPage,
    isFetchingNextPage,
    t,
    translateAlertTypeName,
    onSearchChange,
    onIncludeDeletedChange,
    onOnlyActiveChange,
    onAlertTypeIdChange,
    onSeverityFilterChange,
    onSortByChange,
    onSortOrderChange,
    onNewAlertTypeIdChange,
    onNewSeverityChange,
    onNewExpiresAtChange,
    onNewTitleChange,
    onNewContentChange,
    onCreateAlert,
    onOpenAlert,
    onStartEdit,
    onDeleteAlert,
    onLoadMore,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: alerts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 58,
    overscan: 8,
  });

  return (
    <>
      <div className="mb-3">
        {formError ? (
          <p className="mb-2 rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
            {formError}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
          {canCreateAlert ? (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="h-10 rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-white"
                >
                  {t('alerts.actions.create')}
                </button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined} className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('alerts.createTitle')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onCreateAlert} className="grid gap-2">
                  <Select
                    value={newAlertTypeId || ALERT_TYPE_PLACEHOLDER}
                    onValueChange={(value) => {
                      if (value !== ALERT_TYPE_PLACEHOLDER) {
                        onNewAlertTypeIdChange(value);
                      }
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('alerts.fields.type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALERT_TYPE_PLACEHOLDER} disabled>
                        {t('alerts.fields.type')}
                      </SelectItem>
                      {alertTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {translateAlertTypeName(type.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    value={newTitle}
                    onChange={(event) => onNewTitleChange(event.target.value)}
                    placeholder={t('alerts.fields.title')}
                    required
                    className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
                  />
                  <Select
                    value={newSeverity}
                    onValueChange={(value) =>
                      onNewSeverityChange(value as AlertSeverity)
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALERT_SEVERITY_OPTIONS.map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          {t(`alerts.severity.${severity}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="datetime-local"
                    value={newExpiresAt}
                    onChange={(event) =>
                      onNewExpiresAtChange(event.target.value)
                    }
                    className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
                  />
                  <AlertExpiryQuickActions
                    value={newExpiresAt}
                    onChange={onNewExpiresAtChange}
                    t={t}
                  />
                  <textarea
                    value={newContent}
                    onChange={(event) => onNewContentChange(event.target.value)}
                    placeholder={t('alerts.fields.content')}
                    required
                    rows={4}
                    className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)]"
                  />
                  <DialogFooter>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isCreating
                        ? t('alerts.actions.creating')
                        : t('alerts.actions.create')}
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
          <DebouncedSearchInput
            value={search}
            onValueChange={onSearchChange}
            placeholder={t('alerts.searchPlaceholder')}
            className="h-10 flex-1 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
          />
          <Select value={alertTypeId} onValueChange={onAlertTypeIdChange}>
            <SelectTrigger className="h-10 !w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t('alerts.filters.allTypes')}
              </SelectItem>
              {alertTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {translateAlertTypeName(type.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select
            value={sortBy}
            onValueChange={(value) =>
              onSortByChange(
                value as 'severity' | 'createdAt' | 'expiresAt' | 'title',
              )
            }
          >
            <SelectTrigger className="h-10 !w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">
                {t('alerts.filters.sortFields.severity')}
              </SelectItem>
              <SelectItem value="createdAt">
                {t('alerts.filters.sortFields.createdAt')}
              </SelectItem>
              <SelectItem value="expiresAt">
                {t('alerts.filters.sortFields.expiresAt')}
              </SelectItem>
              <SelectItem value="title">
                {t('alerts.filters.sortFields.title')}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortOrder}
            onValueChange={(value) =>
              onSortOrderChange(value as 'asc' | 'desc')
            }
          >
            <SelectTrigger className="h-10 !w-40 whitespace-nowrap">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                {t('common.sortDirections.asc')}
              </SelectItem>
              <SelectItem value="desc">
                {t('common.sortDirections.desc')}
              </SelectItem>
            </SelectContent>
          </Select>
          {canManageAlert ? (
            <>
              <label className="flex shrink-0 items-center gap-2 text-sm leading-none">
                <Checkbox
                  checked={includeDeleted}
                  onCheckedChange={(checked) =>
                    onIncludeDeletedChange(Boolean(checked))
                  }
                />
                {t('alerts.includeDeleted')}
              </label>
              <label className="flex shrink-0 items-center gap-2 text-sm leading-none">
                <Checkbox
                  checked={onlyActive}
                  onCheckedChange={(checked) =>
                    onOnlyActiveChange(Boolean(checked))
                  }
                />
                {t('alerts.onlyActive')}
              </label>
            </>
          ) : null}
        </div>
      </div>

      {alerts.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {t('alerts.empty')}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
            <div className="min-w-[1020px] text-sm">
              <div className="grid grid-cols-[minmax(240px,1.3fr)_150px_110px_170px_100px_170px_180px] bg-black/5 text-left text-xs uppercase text-[var(--muted-foreground)]">
                <div className="px-3 py-2 font-semibold">
                  {t('alerts.table.title')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('alerts.table.type')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('alerts.table.severity')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('alerts.table.expires')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('alerts.table.status')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('alerts.table.created')}
                </div>
                <div className="px-3 py-2 text-right font-semibold">
                  {t('alerts.table.actions')}
                </div>
              </div>
              <div ref={scrollRef} className="max-h-[560px] overflow-auto">
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const alert = alerts[virtualRow.index];
                    return (
                      <div
                        key={alert.id}
                        className="absolute left-0 top-0 grid w-full grid-cols-[minmax(240px,1.3fr)_150px_110px_170px_100px_170px_180px] border-t border-black/10 bg-white"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="max-w-[260px] px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onOpenAlert(alert.id)}
                            className="line-clamp-2 text-left font-medium text-[var(--primary)] hover:underline"
                          >
                            {alert.title}
                          </button>
                        </div>
                        <div className="px-3 py-2">
                          {translateAlertTypeName(alert.alertType.name)}
                        </div>
                        <div className="px-3 py-2">
                          {t(`alerts.severity.${alert.severity}`)}
                        </div>
                        <div className="whitespace-nowrap px-3 py-2 text-[var(--muted-foreground)]">
                          {alert.expiresAt
                            ? new Date(alert.expiresAt).toLocaleString('uk-UA')
                            : t('alerts.noExpiry')}
                        </div>
                        <div className="px-3 py-2">
                          {alert.deletedAt
                            ? t('alerts.deletedLabel')
                            : t('alerts.table.active')}
                        </div>
                        <div className="whitespace-nowrap px-3 py-2 text-[var(--muted-foreground)]">
                          {new Date(alert.createdAt).toLocaleString('uk-UA')}
                        </div>
                        <div className="whitespace-nowrap px-3 py-2">
                          {!alert.deletedAt ? (
                            <div className="flex justify-end gap-2">
                              {canUpdateAlert ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onStartEdit({
                                      id: alert.id,
                                      alertTypeId: alert.alertTypeId,
                                      severity: alert.severity,
                                      expiresAt: alert.expiresAt,
                                      title: alert.title,
                                      content: alert.content,
                                    })
                                  }
                                  className="rounded-md border border-[var(--warning-dark)]/40 px-2 py-1 text-xs text-[var(--warning-dark)] hover:bg-[var(--warning)]/10"
                                >
                                  {t('alerts.actions.edit')}
                                </button>
                              ) : null}
                              {canDeleteAlert ? (
                                <button
                                  type="button"
                                  onClick={() => onDeleteAlert(alert.id)}
                                  disabled={isDeleting}
                                  className="rounded-md border border-[var(--danger)] px-2 py-1 text-xs text-[var(--danger)] disabled:opacity-60"
                                >
                                  {t('alerts.actions.delete')}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
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
