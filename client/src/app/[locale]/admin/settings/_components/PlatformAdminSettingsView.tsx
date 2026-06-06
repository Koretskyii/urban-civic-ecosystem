'use client';

import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/hooks';
import { useRouter } from '@/i18n/navigation';
import { RequestsSection } from './sections/RequestsSection/RequestsSection';
import { CitiesSection } from './sections/CitiesSection/CitiesSection';
import { UsersSection } from './sections/UsersSection/UsersSection';

const SECTIONS = ['requests', 'cities', 'users'] as const;
type PlatformAdminSection = (typeof SECTIONS)[number];

export default function PlatformAdminSettingsView({
  section,
}: {
  section?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const activeSection = SECTIONS.includes(section as PlatformAdminSection)
    ? (section as PlatformAdminSection)
    : 'requests';

  const onSectionChange = (nextSection: PlatformAdminSection) => {
    router.push(`/admin/settings?section=${nextSection}`);
  };

  if (currentUser.isLoading) {
    return (
      <div className="p-4 text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (currentUser.data?.systemRole !== 'ADMIN') {
    return (
      <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
        {t('forbidden.description')}
      </p>
    );
  }

  return (
    <div className="w-full space-y-5 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--primary)]">
          {t('platformAdmin.title')}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t('platformAdmin.subtitle')}
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto border-b border-black/10">
        {SECTIONS.map((item) => {
          const isActive = item === activeSection;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSectionChange(item)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'border-[var(--secondary)] text-[var(--secondary-dark)]'
                  : 'border-transparent text-[var(--primary-light)] hover:text-[var(--primary)]'
              }`}
            >
              {t(`platformAdmin.sections.${item}`)}
            </button>
          );
        })}
      </nav>

      {activeSection === 'requests' ? <RequestsSection /> : null}
      {activeSection === 'cities' ? <CitiesSection /> : null}
      {activeSection === 'users' ? <UsersSection /> : null}
    </div>
  );
}
