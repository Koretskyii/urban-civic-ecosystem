import { useTranslations } from 'next-intl';

export function TableState({
  isLoading,
  isError,
  isEmpty,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
}) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="py-6 text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
        {t('platformAdmin.loadError')}
      </p>
    );
  }

  if (isEmpty) {
    return (
      <p className="rounded-md border border-black/10 px-3 py-4 text-sm text-[var(--muted-foreground)]">
        {t('platformAdmin.empty')}
      </p>
    );
  }

  return null;
}
