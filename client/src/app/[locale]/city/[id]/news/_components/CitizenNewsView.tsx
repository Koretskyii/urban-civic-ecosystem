'use client';

import { FilePreviewList } from '@/components/ui/file-preview-list';
import { DebouncedSearchInput } from '@/components';
import { useResponsiveVirtualColumns } from '@/hooks';
import type { Attachment, News } from '@/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { useTranslations } from 'next-intl';
import { useRef } from 'react';

type TranslationFn = ReturnType<typeof useTranslations>;

const NEWS_GRID_BREAKPOINTS = [{ minWidth: 768, columns: 2 }] as const;

interface CitizenNewsViewProps {
  news: News[];
  search: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  t: TranslationFn;
  onSearchChange: (value: string) => void;
  onOpenNews: (newsId: string) => void;
  onLoadMore: () => void;
}

export function CitizenNewsView(props: CitizenNewsViewProps) {
  const {
    news,
    search,
    isFetchingNextPage,
    hasNextPage,
    t,
    onSearchChange,
    onOpenNews,
    onLoadMore,
  } = props;
  const columns = useResponsiveVirtualColumns(NEWS_GRID_BREAKPOINTS, 1);
  const rowCount = Math.ceil(news.length / columns);
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 270,
    overscan: 5,
  });

  return (
    <>
      <div className="mb-3">
        <DebouncedSearchInput
          placeholder={t('news.searchPlaceholder')}
          value={search}
          onValueChange={onSearchChange}
          className="h-10 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
        />
      </div>

      {news.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {t('news.empty')}
        </p>
      ) : (
        <>
          <div ref={scrollRef} className="max-h-[720px] overflow-auto pr-1">
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const rowItems = news.slice(
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
                        columns === 2
                          ? 'grid grid-cols-2 gap-3'
                          : 'grid grid-cols-1 gap-3'
                      }
                    >
                      {rowItems.map((item) => {
                        const date = new Date(item.createdAt);
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
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onOpenNews(item.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onOpenNews(item.id);
                              }
                            }}
                            className="flex min-h-[250px] flex-col rounded-xl border border-black/10 border-t-4 border-t-[var(--secondary)] bg-[linear-gradient(180deg,rgba(63,136,197,0.05)_0%,#fff_36%)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(63,136,197,0.18)]"
                          >
                            <p className="mb-1 text-xs text-[var(--muted-foreground)]">
                              {formattedDate} {t('common.timeSeparator')}{' '}
                              {formattedTime}
                            </p>
                            <h3 className="mb-2 text-lg font-semibold">
                              {item.title}
                            </h3>
                            <p className="mb-2 flex-1 text-sm text-[var(--muted-foreground)]">
                              {item.content}
                            </p>
                            {item.attachments?.length ? (
                              <div className="mb-2">
                                <FilePreviewList
                                  attachments={item.attachments as Attachment[]}
                                />
                              </div>
                            ) : null}
                            <div className="my-1 h-px bg-black/10" />
                            <p className="text-xs font-medium text-[var(--primary-light)]">
                              {t('news.officialSource')}
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
