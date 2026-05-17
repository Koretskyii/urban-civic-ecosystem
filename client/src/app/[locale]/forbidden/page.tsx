'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function ForbiddenPage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-gray-900">403</h1>
        <p className="mt-4 text-xl font-semibold text-gray-700">
          {t('forbidden.title')}
        </p>
        <p className="mt-2 text-gray-600">{t('forbidden.description')}</p>

        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            {t('forbidden.goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-block rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('forbidden.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
