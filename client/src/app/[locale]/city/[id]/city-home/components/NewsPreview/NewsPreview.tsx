import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { truncate } from '../../helpers/truncate';
import type { NewsPreviewProps } from '../../types/CityHomeView.types';

export function NewsPreview({ item, dateFormatter, onOpen }: NewsPreviewProps) {
  const date = item.publishedAt ?? item.createdAt;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-lg border border-black/10 bg-[var(--surface-2)] p-3 text-left transition hover:border-[var(--secondary)]/40 hover:bg-[var(--secondary)]/8"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge variant="outline">
          <FileText size={12} className="mr-1" />
          {dateFormatter.format(new Date(date))}
        </Badge>
      </div>
      <h3 className="line-clamp-2 text-base font-semibold text-[var(--primary)]">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-3 text-sm text-[var(--muted-foreground)]">
        {truncate(item.content)}
      </p>
    </button>
  );
}
