'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { DebouncedSearchInput } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Survey, SurveyStatus } from '@/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TranslationFn = ReturnType<typeof useTranslations>;

const STATUS_OPTIONS: Array<'all' | SurveyStatus> = ['all', 'OPEN', 'CLOSED'];

interface ManageSurveysViewProps {
  surveys: Survey[];
  search: string;
  statusFilter: 'all' | SurveyStatus;
  includeDeleted: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
  isCreating: boolean;
  isClosing: boolean;
  isDeleting: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  createOpen: boolean;
  newTitle: string;
  newDescription: string;
  newOptions: string[];
  newClosesAt: string;
  formError: string;
  t: TranslationFn;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: 'all' | SurveyStatus) => void;
  onIncludeDeletedChange: (value: boolean) => void;
  onCreateOpenChange: (open: boolean) => void;
  onNewTitleChange: (value: string) => void;
  onNewDescriptionChange: (value: string) => void;
  onNewOptionsChange: (options: string[]) => void;
  onNewClosesAtChange: (value: string) => void;
  onCreateSurvey: (e: FormEvent) => void;
  onOpenSurvey: (surveyId: string) => void;
  onStartEdit: (survey: Survey) => void;
  onCloseSurvey: (surveyId: string) => void;
  onDeleteSurvey: (surveyId: string) => void;
  onLoadMore: () => void;
}

export function ManageSurveysView(props: ManageSurveysViewProps) {
  const {
    surveys,
    search,
    statusFilter,
    includeDeleted,
    canCreate,
    canUpdate,
    canDelete,
    canManage,
    isCreating,
    isClosing,
    isDeleting,
    hasNextPage,
    isFetchingNextPage,
    createOpen,
    newTitle,
    newDescription,
    newOptions,
    newClosesAt,
    formError,
    t,
    onSearchChange,
    onStatusFilterChange,
    onIncludeDeletedChange,
    onCreateOpenChange,
    onNewTitleChange,
    onNewDescriptionChange,
    onNewOptionsChange,
    onNewClosesAtChange,
    onCreateSurvey,
    onOpenSurvey,
    onStartEdit,
    onCloseSurvey,
    onDeleteSurvey,
    onLoadMore,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: surveys.length,
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
          {canCreate ? (
            <button
              type="button"
              onClick={() => onCreateOpenChange(true)}
              className="h-10 rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-white"
            >
              {t('surveys.createTitle')}
            </button>
          ) : null}
          <DebouncedSearchInput
            placeholder={t('surveys.searchPlaceholder')}
            value={search}
            onValueChange={onSearchChange}
            className="h-10 flex-1 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              onStatusFilterChange(v as 'all' | SurveyStatus)
            }
          >
            <SelectTrigger className="h-10 !w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'all'
                    ? t('surveys.statusFilter.all')
                    : t(`surveys.statusFilter.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeDeleted}
                onCheckedChange={(checked) =>
                  onIncludeDeletedChange(Boolean(checked))
                }
              />
              {t('surveys.includeDeleted')}
            </label>
          ) : null}
        </div>
      </div>

      {surveys.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {t('surveys.empty')}
        </p>
      ) : (
        <>
          <div className="rounded-lg border border-black/10 bg-white">
            <div className="text-sm">
              <div className="grid grid-cols-[2fr_1fr_0.6fr_1.3fr_0.7fr_1.1fr_0.8fr] bg-black/5 text-left text-xs uppercase text-[var(--muted-foreground)]">
                <div className="px-3 py-2 font-semibold">
                  {t('surveys.table.title')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('surveys.table.status')}
                </div>
                <div className="px-3 py-2 text-center font-semibold">
                  {t('surveys.table.votes')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('surveys.table.closesAt')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('surveys.table.deleted')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('surveys.table.manage')}
                </div>
                <div className="px-3 py-2 text-right font-semibold">
                  {t('surveys.table.delete')}
                </div>
              </div>
              <div
                ref={scrollRef}
                className="max-h-[560px] overflow-y-auto overflow-x-hidden"
              >
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = surveys[virtualRow.index];
                    const isClosed = item.status === 'CLOSED';
                    const isDeleted = Boolean(item.deletedAt);
                    return (
                      <div
                        key={item.id}
                        className={`absolute left-0 top-0 grid w-full grid-cols-[2fr_1fr_0.6fr_1.3fr_0.7fr_1.1fr_0.8fr] border-t border-black/10 bg-white ${isDeleted ? 'opacity-60' : ''}`}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="min-w-0 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onOpenSurvey(item.id)}
                            className="line-clamp-2 text-left font-medium text-[var(--primary)] hover:underline"
                          >
                            {item.title}
                          </button>
                        </div>
                        <div className="px-3 py-2">
                          <Badge variant={isClosed ? 'outline' : 'default'}>
                            {t(`surveys.status.${item.status}`)}
                          </Badge>
                        </div>
                        <div className="px-3 py-2 text-center">
                          <span className="inline-flex min-w-7 justify-center rounded-full border border-black/15 px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                            {item._count?.votes ?? 0}
                          </span>
                        </div>
                        <div className="whitespace-nowrap px-3 py-2 text-[var(--muted-foreground)]">
                          {item.closesAt
                            ? new Date(item.closesAt).toLocaleString('uk-UA')
                            : '—'}
                        </div>
                        <div className="px-3 py-2 text-[var(--muted-foreground)]">
                          {isDeleted ? t('surveys.deletedLabel') : '—'}
                        </div>
                        {/* Edit + Close — only for active, non-deleted surveys */}
                        <div className="whitespace-nowrap px-3 py-2">
                          {!isDeleted && !isClosed ? (
                            <div className="flex gap-2">
                              {canUpdate ? (
                                <button
                                  type="button"
                                  onClick={() => onStartEdit(item)}
                                  className="rounded-md border border-[var(--secondary)]/40 px-2 py-1 text-xs text-[var(--secondary-dark)] hover:bg-[var(--secondary)]/10"
                                >
                                  {t('surveys.actions.edit')}
                                </button>
                              ) : null}
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => onCloseSurvey(item.id)}
                                  disabled={isClosing}
                                  className="rounded-md border border-[var(--warning)] px-2 py-1 text-xs text-[var(--warning-dark)] hover:bg-[var(--warning)]/10 disabled:opacity-60"
                                >
                                  {t('surveys.actions.closeShort')}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {/* Delete */}
                        <div className="whitespace-nowrap px-3 py-2 text-right">
                          {!isDeleted && canDelete ? (
                            <button
                              type="button"
                              onClick={() => onDeleteSurvey(item.id)}
                              disabled={isDeleting}
                              className="rounded-md border border-[var(--danger)] px-2 py-1 text-xs text-[var(--danger)] disabled:opacity-60"
                            >
                              {t('surveys.actions.delete')}
                            </button>
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
              className="mt-3 rounded-md border border-[var(--secondary)]/30 px-3 py-2 text-sm text-[var(--secondary-dark)] disabled:opacity-60"
            >
              {isFetchingNextPage
                ? t('common.processing')
                : t('common.loadMore')}
            </button>
          ) : null}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('surveys.createTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSurvey} className="grid gap-2">
            <input
              value={newTitle}
              onChange={(e) => onNewTitleChange(e.target.value)}
              placeholder={t('surveys.fields.title')}
              className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <textarea
              value={newDescription}
              onChange={(e) => onNewDescriptionChange(e.target.value)}
              placeholder={t('surveys.fields.description')}
              rows={2}
              className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <div className="grid gap-1.5">
              {newOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...newOptions];
                      next[i] = e.target.value;
                      onNewOptionsChange(next);
                    }}
                    placeholder={t('surveys.fields.option', { n: i + 1 })}
                    className="h-9 flex-1 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
                  />
                  {newOptions.length > 2 ? (
                    <button
                      type="button"
                      onClick={() =>
                        onNewOptionsChange(newOptions.filter((_, j) => j !== i))
                      }
                      className="text-xs text-[var(--danger-dark)]"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              ))}
              {newOptions.length < 6 ? (
                <button
                  type="button"
                  onClick={() => onNewOptionsChange([...newOptions, ''])}
                  className="text-left text-xs text-[var(--secondary-dark)]"
                >
                  {t('surveys.fields.addOption')}
                </button>
              ) : null}
            </div>
            <input
              type="datetime-local"
              value={newClosesAt}
              onChange={(e) => onNewClosesAtChange(e.target.value)}
              step="60"
              className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            {formError ? (
              <p className="text-xs text-[var(--danger-dark)]">{formError}</p>
            ) : null}
            <DialogFooter>
              <button
                type="button"
                onClick={() => onCreateOpenChange(false)}
                className="rounded-md px-3 py-2 text-sm"
              >
                {t('surveys.actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isCreating
                  ? t('surveys.actions.creating')
                  : t('surveys.actions.create')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
