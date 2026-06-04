'use client';

import { FilePreviewList } from '@/components/ui/file-preview-list';
import type { CityRequestDetail } from '@/types';

interface RequestTimelineSectionProps {
  reports: CityRequestDetail['reports'];
  title: string;
  emptyLabel: string;
  noDescriptionLabel: string;
}

export function RequestTimelineSection(props: RequestTimelineSectionProps) {
  const { reports, title, emptyLabel, noDescriptionLabel } = props;

  return (
    <div className="rounded-lg border border-black/10 p-3">
      <p className="mb-1 text-base font-semibold">{title}</p>
      {reports.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div key={report.id}>
              <p className="text-sm font-semibold">
                {report.type}
                {report.status ? ` - ${report.status}` : ''}
              </p>
              <p className="text-sm">
                {report.description || noDescriptionLabel}
              </p>
              {report.attachments.length > 0 ? (
                <div className="mt-2">
                  <FilePreviewList attachments={report.attachments} />
                </div>
              ) : null}
              <p className="text-xs text-[var(--muted-foreground)]">
                {report.author.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
