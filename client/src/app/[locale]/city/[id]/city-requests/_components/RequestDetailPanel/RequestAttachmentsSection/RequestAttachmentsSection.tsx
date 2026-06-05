'use client';

import { FilePreviewList } from '@/components/ui/file-preview-list';
import type { CityRequestDetail } from '@/types';
import { cn } from '@/lib/utils';

interface RequestAttachmentsSectionProps {
  attachments: CityRequestDetail['attachments'];
  title: string;
  emptyLabel: string;
  className?: string;
}

export function RequestAttachmentsSection(
  props: RequestAttachmentsSectionProps,
) {
  const { attachments, title, emptyLabel, className } = props;

  return (
    <div
      className={cn(
        'rounded-lg border border-black/10 p-3 flex flex-col',
        className,
      )}
    >
      <p className="mb-1 text-base font-semibold">{title}</p>
      {attachments.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">{emptyLabel}</p>
      ) : (
        <div className="mt-2 flex-1">
          <FilePreviewList attachments={attachments} imageVariant="large" />
        </div>
      )}
    </div>
  );
}
