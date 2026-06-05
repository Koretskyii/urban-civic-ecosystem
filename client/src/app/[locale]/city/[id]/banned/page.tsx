import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

interface BannedPageProps {
  params: Promise<{ id: string }>;
}

export default async function BannedPage(props: BannedPageProps) {
  await props.params;
  const t = await getTranslations();

  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-xl border-y border-black/10 py-8 text-center">
        <p className="text-sm font-semibold uppercase text-[var(--danger)]">
          {t('banned.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--primary)]">
          {t('banned.title')}
        </h1>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          {t('banned.description', {
            city: t('banned.thisCity'),
          })}
        </p>
        <p className="mt-2 text-sm text-[var(--primary-light)]">
          {t('banned.nextStep')}
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white"
          >
            {t('banned.goHome')}
          </Link>
        </div>
      </div>
    </section>
  );
}
