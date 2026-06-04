'use client';

import { FilePreviewList } from '@/components/ui/file-preview-list';
import type { CityRequestDetail } from '@/types';

interface RequestAttachmentsSectionProps {
  attachments: CityRequestDetail['attachments'];
  title: string;
  emptyLabel: string;
}

export function RequestAttachmentsSection(
  props: RequestAttachmentsSectionProps,
) {
  const { attachments, title, emptyLabel } = props;

  return (
    <div className="rounded-lg border border-black/10 p-3">
      <p className="mb-1 text-base font-semibold">{title}</p>
      {attachments.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">{emptyLabel}</p>
      ) : (
        <div className="mt-2">
          <FilePreviewList attachments={attachments} />
        </div>
      )}
    </div>
  );
}
