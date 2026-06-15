'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { BarChart3, Settings } from 'lucide-react';

const TABS = [
  { key: 'overview', href: '/admin', icon: BarChart3, exact: true },
  { key: 'settings', href: '/admin/settings', icon: Settings, exact: false },
] as const;

export function AdminTabsNav() {
  const t = useTranslations('analytics.adminTabs');
  const pathname = usePathname();

  return (
    <nav className="inline-flex items-center gap-1 rounded-md bg-black/5 p-1">
      {TABS.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm no-underline transition-colors ${
              isActive
                ? 'bg-white font-medium text-[var(--secondary-dark)] shadow-sm'
                : 'text-[var(--primary-light)] hover:text-[var(--primary)]'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
