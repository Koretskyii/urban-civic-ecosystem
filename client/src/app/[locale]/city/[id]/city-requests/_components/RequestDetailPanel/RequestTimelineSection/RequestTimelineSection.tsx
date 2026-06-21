'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { FilePreviewList } from '@/components/ui/file-preview-list';
import type { CityRequestDetail } from '@/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface RequestTimelineSectionProps {
  reports: CityRequestDetail['reports'];
  title: string;
  emptyLabel: string;
  noDescriptionLabel: string;
}

export function RequestTimelineSection(props: RequestTimelineSectionProps) {
  const { reports, title, emptyLabel, noDescriptionLabel } = props;
  const locale = useLocale();
  const t = useTranslations();

  const sortedReports = useMemo(
    () =>
      [...reports].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [reports],
  );

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

  return (
    <Card className="flex h-full flex-col border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 p-4 md:p-5">
        <h3 className="text-lg font-semibold leading-none tracking-tight text-[var(--primary)]">
          {title}
        </h3>
      </div>
      <CardContent className="flex-1 p-4 md:p-5">
        {sortedReports.length === 0 ? (
          <div className="flex h-full min-h-[100px] items-center justify-center text-sm text-[var(--muted-foreground)]">
            {emptyLabel}
          </div>
        ) : (
          <div className="relative ml-3 border-l-2 border-black/10 pl-6 space-y-6 py-2">
            {sortedReports.map((report) => {
              const isResolution = report.type === 'RESOLUTION';
              const isRejection = report.type === 'REJECTION';
              const Icon = isResolution
                ? CheckCircle2
                : isRejection
                  ? XCircle
                  : Clock;

              const iconColor = isResolution
                ? 'text-emerald-600 border-emerald-600 bg-emerald-50'
                : isRejection
                  ? 'text-rose-600 border-rose-600 bg-rose-50'
                  : 'text-[var(--primary)] border-[var(--primary)] bg-[var(--primary)]/5';

              return (
                <div key={report.id} className="relative">
                  <div
                    className={cn(
                      'absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2',
                      iconColor,
                    )}
                  >
                    <Icon size={14} className="bg-transparent" />
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-black/5 bg-gray-50/50 p-4 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--primary)]">
                          {t(`cityProblem.reportTypes.${report.type}`)}
                          {report.status ? (
                            <span className="text-[var(--muted-foreground)] font-normal ml-1">
                              → {t(`cityProblem.statuses.${report.status}`)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                        {dateFormatter.format(new Date(report.createdAt))}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-[var(--primary-light)] whitespace-pre-wrap">
                      {report.description || (
                        <span className="italic opacity-60">
                          {noDescriptionLabel}
                        </span>
                      )}
                    </p>

                    {report.attachments.length > 0 ? (
                      <div className="mt-2 pt-3 border-t border-black/5">
                        <FilePreviewList
                          attachments={report.attachments}
                          imageVariant="large"
                        />
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 pt-2 text-xs text-[var(--muted-foreground)]">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]/10 font-bold text-[var(--primary)] uppercase">
                        {report.author.name.charAt(0)}
                      </div>
                      <span className="font-medium">{report.author.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
