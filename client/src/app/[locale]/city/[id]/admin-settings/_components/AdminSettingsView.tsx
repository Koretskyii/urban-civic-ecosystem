'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { usePermission } from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { CITY_MEMBER_ROLE_OPTIONS } from '@/features/city-members';
import { MembersSettingsSection } from './sections/MembersSettingsSection';
import { DepartmentsSettingsSection } from './sections/DepartmentsSettingsSection';
import { CityProfileSettingsSection } from './sections/CityProfileSettingsSection';
import { ADMIN_SETTINGS_SECTIONS } from '../constants';
import { AdminSettingsSection } from '../types';

interface AdminSettingsViewProps {
  cityId: string;
  section?: string;
}

export default function AdminSettingsView({
  cityId,
  section,
}: AdminSettingsViewProps) {
  const t = useTranslations();
  const router = useRouter();
  const { can: canManageRoles, isLoading: isPermissionLoading } = usePermission(
    PERMISSION_GROUPS.ROLE.MANAGE,
    { cityId },
  );
  const activeSection = ADMIN_SETTINGS_SECTIONS.includes(
    section as AdminSettingsSection,
  )
    ? (section as AdminSettingsSection)
    : 'members';

  const onSectionChange = (section: AdminSettingsSection) => {
    router.push(`/city/${cityId}/admin-settings?section=${section}`);
  };

  if (isPermissionLoading) {
    return (
      <div className="text-sm text-[var(--muted-foreground)]">Loading...</div>
    );
  }

  if (!canManageRoles) {
    return (
      <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
        {t('forbidden.description')}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--primary)]">
          {t('adminSettings.title')}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t('adminSettings.subtitle')}
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto border-b border-black/10">
        {ADMIN_SETTINGS_SECTIONS.map((section) => {
          const isActive = section === activeSection;

          return (
            <button
              key={section}
              type="button"
              onClick={() => onSectionChange(section)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'border-[var(--secondary)] text-[var(--secondary-dark)]'
                  : 'border-transparent text-[var(--primary-light)] hover:text-[var(--primary)]'
              }`}
            >
              {t(`adminSettings.sections.${section}`)}
            </button>
          );
        })}
      </nav>

      {activeSection === 'members' ? (
        <MembersSettingsSection cityId={cityId} />
      ) : null}
      {activeSection === 'departments' ? (
        <DepartmentsSettingsSection cityId={cityId} />
      ) : null}
      {activeSection === 'city-profile' ? (
        <CityProfileSettingsSection cityId={cityId} />
      ) : null}
      {activeSection === 'roles-permissions' ? (
        <RolesPermissionsSection />
      ) : null}
    </div>
  );
}

function RolesPermissionsSection() {
  const t = useTranslations();

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-[var(--primary)]">
        {t('adminSettings.sections.roles-permissions')}
      </h2>
      <div className="grid gap-2 md:grid-cols-2">
        {CITY_MEMBER_ROLE_OPTIONS.map((role) => (
          <article key={role} className="rounded-md border border-black/10 p-3">
            <p className="font-medium text-[var(--primary)]">
              {t(`cityMembers.roles.${role}`)}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {t(`adminSettings.roleDescriptions.${role}`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
