import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="mt-auto border-t border-[var(--secondary)]/20 bg-[var(--surface-2)] px-8 py-8 text-[var(--primary)]">
      <div className="mx-2">
        <p className="text-sm text-[var(--primary-light)]">
          {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
