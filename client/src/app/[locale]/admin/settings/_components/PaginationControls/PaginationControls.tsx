import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function PaginationControls({
  page,
  limit,
  total,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-2 pt-2 text-sm text-[var(--muted-foreground)] md:flex-row md:items-center md:justify-between">
      <span>{t('platformAdmin.pageSummary', { start, end, total })}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('platformAdmin.previous')}
        </Button>
        <span className="min-w-20 text-center">
          {t('platformAdmin.pageNumber', { page, totalPages })}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('platformAdmin.next')}
        </Button>
      </div>
    </div>
  );
}
