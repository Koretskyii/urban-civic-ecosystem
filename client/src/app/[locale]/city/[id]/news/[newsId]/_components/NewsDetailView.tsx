'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, CalendarDays, Newspaper } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useCityNewsDetail } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Attachment } from '@/types';
import NewsAttachments from './NewsAttachments/NewsAttachments';

interface NewsDetailViewProps {
  cityId: string;
  newsId: string;
}

export default function NewsDetailView({
  cityId,
  newsId,
}: NewsDetailViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: news, isLoading, isError } = useCityNewsDetail(cityId, newsId);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  );

  if (isLoading) {
    return (
      <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (isError || !news) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/city/${cityId}/news`)}
        >
          <ArrowLeft size={16} className="mr-2" />
          {t('news.detail.backToNews')}
        </Button>
        <p className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-4 text-sm text-[var(--danger-dark)]">
          {t('news.loadError')}
        </p>
      </div>
    );
  }

  const publishedDate = news.publishedAt ?? news.createdAt;
  const attachments = (news.attachments ?? []) as Attachment[];

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push(`/city/${cityId}/news`)}
      >
        <ArrowLeft size={16} className="mr-2" />
        {t('news.detail.backToNews')}
      </Button>

      <article className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 bg-[linear-gradient(180deg,rgba(63,136,197,0.08)_0%,#fff_100%)] p-5 md:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={news.deletedAt ? 'danger' : 'secondary'}>
              {news.deletedAt
                ? t('news.deletedLabel')
                : t('news.officialSource')}
            </Badge>
            <Badge variant="outline">
              <CalendarDays size={12} className="mr-1" />
              {dateFormatter.format(new Date(publishedDate))}
            </Badge>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--secondary)]/12 p-2 text-[var(--secondary)]">
              <Newspaper size={28} />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl leading-tight text-[var(--primary)] md:text-4xl">
                {news.title}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {t('news.detail.updatedAt', {
                  date: dateFormatter.format(new Date(news.updatedAt)),
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="whitespace-pre-wrap text-base leading-7 text-[var(--primary-light)]">
              {news.content}
            </div>
          </div>

          {attachments.length > 0 ? (
            <NewsAttachments attachments={attachments} />
          ) : (
            <p className="h-fit rounded-lg border border-black/10 bg-[var(--surface-2)] px-3 py-4 text-sm text-[var(--muted-foreground)]">
              {t('news.detail.noAttachments')}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
