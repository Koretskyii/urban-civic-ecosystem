'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from './LocaleSwitcher';
import HeaderNotifications from './HeaderNotifications';
import { useAuthStore } from '@/store';
import { ShieldCheck } from 'lucide-react';

export default function Header() {
  const t = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSystemAdmin = useAuthStore((s) => s.user?.systemRole === 'ADMIN');

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--secondary)]/25 bg-white/92 text-[var(--primary)] shadow-[0_8px_24px_rgba(6,24,41,0.1)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="cursor-pointer text-xl font-bold text-[var(--primary)] no-underline"
        >
          <span>{t('app.name')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/city/create"
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-[var(--primary)] no-underline transition hover:bg-[var(--warning)]/20 hover:shadow-sm"
          >
            {t('header.createCity')}
          </Link>
          {isSystemAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-[var(--primary)] no-underline transition hover:bg-[var(--secondary)]/20 hover:shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {t('header.adminSettings')}
            </Link>
          ) : null}
          {isAuthenticated ? (
            <>
              <HeaderNotifications />
              <Link
                href="/user/profile"
                className="rounded-md px-3 py-2 text-sm font-medium text-[var(--primary)] no-underline transition hover:bg-[var(--secondary)]/20 hover:shadow-sm"
              >
                {t('header.profile')}
              </Link>
            </>
          ) : (
            <Link
              href="/user/auth"
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--primary)] no-underline transition hover:bg-[var(--success)]/20 hover:shadow-sm"
            >
              {t('header.signIn')}
            </Link>
          )}
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
