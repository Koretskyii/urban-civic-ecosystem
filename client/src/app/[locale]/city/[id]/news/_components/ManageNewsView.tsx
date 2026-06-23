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
import { FileUpload } from '@/components/ui/file-upload';
import type { News } from '@/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TranslationFn = ReturnType<typeof useTranslations>;

interface ManageNewsViewProps {
  news: News[];
  search: string;
  includeDeleted: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
  formError: string;
  newTitle: string;
  newContent: string;
  newFiles: File[];
  canCreateNews: boolean;
  canUpdateNews: boolean;
  canDeleteNews: boolean;
  canManageNews: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  t: TranslationFn;
  onSearchChange: (value: string) => void;
  onIncludeDeletedChange: (value: boolean) => void;
  onSortByChange: (value: 'createdAt' | 'updatedAt' | 'title') => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onNewTitleChange: (value: string) => void;
  onNewContentChange: (value: string) => void;
  onNewFilesChange: (value: File[]) => void;
  onCreateNews: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onOpenNews: (newsId: string) => void;
  onStartEdit: (item: { id: string; title: string; content: string }) => void;
  onDeleteNews: (newsId: string) => void;
  onLoadMore: () => void;
}

export function ManageNewsView(props: ManageNewsViewProps) {
  const {
    news,
    search,
    includeDeleted,
    sortBy,
    sortOrder,
    formError,
    newTitle,
    newContent,
    newFiles,
    canCreateNews,
    canUpdateNews,
    canDeleteNews,
    canManageNews,
    isCreating,
    isDeleting,
    hasNextPage,
    isFetchingNextPage,
    t,
    onSearchChange,
    onIncludeDeletedChange,
    onSortByChange,
    onSortOrderChange,
    onNewTitleChange,
    onNewContentChange,
    onNewFilesChange,
    onCreateNews,
    onOpenNews,
    onStartEdit,
    onDeleteNews,
    onLoadMore,
  } = props;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: news.length,
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
          {canCreateNews ? (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="h-10 rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-white"
                >
                  {t('news.actions.create')}
                </button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined} className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('news.createTitle')}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={async (event) => {
                    const isCreated = await onCreateNews(event);
                    if (isCreated) setIsCreateDialogOpen(false);
                  }}
                  className="grid gap-2"
                >
                  <input
                    placeholder={t('news.fields.title')}
                    value={newTitle}
                    onChange={(event) => onNewTitleChange(event.target.value)}
                    required
                    className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
                  />
                  <textarea
                    placeholder={t('news.fields.content')}
                    value={newContent}
                    onChange={(event) => onNewContentChange(event.target.value)}
                    required
                    rows={4}
                    className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
                  />
                  <FileUpload
                    value={newFiles}
                    onChange={onNewFilesChange}
                    maxFiles={5}
                    disabled={isCreating}
                  />
                  <DialogFooter>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isCreating
                        ? t('news.actions.creating')
                        : t('news.actions.create')}
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
          <DebouncedSearchInput
            placeholder={t('news.searchPlaceholder')}
            value={search}
            onValueChange={onSearchChange}
            className="h-10 flex-1 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
          />
          {canManageNews ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeDeleted}
                onCheckedChange={(checked) =>
                  onIncludeDeletedChange(Boolean(checked))
                }
              />
              {t('news.includeDeleted')}
            </label>
          ) : null}
          <Select
            value={sortBy}
            onValueChange={(value) =>
              onSortByChange(value as 'createdAt' | 'updatedAt' | 'title')
            }
          >
            <SelectTrigger className="h-10 !w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">
                {t('news.filters.sortFields.createdAt')}
              </SelectItem>
              <SelectItem value="updatedAt">
                {t('news.filters.sortFields.updatedAt')}
              </SelectItem>
              <SelectItem value="title">
                {t('news.filters.sortFields.title')}
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
              <SelectItem value="desc">
                {t('common.sortDirections.desc')}
              </SelectItem>
              <SelectItem value="asc">
                {t('common.sortDirections.asc')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {news.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {t('news.empty')}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
            <div className="min-w-[900px] text-sm">
              <div className="grid grid-cols-[minmax(240px,1.4fr)_170px_170px_90px_90px_180px] bg-black/5 text-left text-xs uppercase text-[var(--muted-foreground)]">
                <div className="px-3 py-2 font-semibold">
                  {t('news.table.title')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('news.table.created')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('news.table.updated')}
                </div>
                <div className="px-3 py-2 font-semibold">
                  {t('news.table.deleted')}
                </div>
                <div className="px-3 py-2 text-center font-semibold">
                  {t('news.table.files')}
                </div>
                <div className="px-3 py-2 text-right font-semibold">
                  {t('news.table.actions')}
                </div>
              </div>
              <div ref={scrollRef} className="max-h-[560px] overflow-auto">
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = news[virtualRow.index];
                    return (
                      <div
                        key={item.id}
                        className="absolute left-0 top-0 grid w-full grid-cols-[minmax(240px,1.4fr)_170px_170px_90px_90px_180px] border-t border-black/10 bg-white"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="max-w-[280px] px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onOpenNews(item.id)}
                            className="line-clamp-2 text-left font-medium text-[var(--primary)] hover:underline"
                          >
                            {item.title}
                          </button>
                        </div>
                        <div className="whitespace-nowrap px-3 py-2 text-[var(--muted-foreground)]">
                          {new Date(item.createdAt).toLocaleString('uk-UA')}
                        </div>
                        <div className="whitespace-nowrap px-3 py-2 text-[var(--muted-foreground)]">
                          {new Date(item.updatedAt).toLocaleString('uk-UA')}
                        </div>
                        <div className="px-3 py-2">
                          {item.deletedAt ? t('news.deletedLabel') : '-'}
                        </div>
                        <div className="px-3 py-2 text-center">
                          <span className="inline-flex min-w-7 justify-center rounded-full border border-black/15 px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                            {item.attachments?.length ?? 0}
                          </span>
                        </div>
                        <div className="whitespace-nowrap px-3 py-2">
                          {!item.deletedAt ? (
                            <div className="flex justify-end gap-2">
                              {canUpdateNews ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onStartEdit({
                                      id: item.id,
                                      title: item.title,
                                      content: item.content,
                                    })
                                  }
                                  className="rounded-md border border-[var(--secondary)]/40 px-2 py-1 text-xs text-[var(--secondary-dark)] hover:bg-[var(--secondary)]/10"
                                >
                                  {t('news.actions.edit')}
                                </button>
                              ) : null}
                              {canDeleteNews ? (
                                <button
                                  type="button"
                                  onClick={() => onDeleteNews(item.id)}
                                  disabled={isDeleting}
                                  className="rounded-md border border-[var(--danger)] px-2 py-1 text-xs text-[var(--danger)] disabled:opacity-60"
                                >
                                  {t('news.actions.delete')}
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
              className="mt-3 rounded-md border border-[var(--secondary)]/30 px-3 py-2 text-sm text-[var(--secondary-dark)] disabled:opacity-60"
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
