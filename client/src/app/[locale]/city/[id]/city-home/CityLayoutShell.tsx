'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useCityById, usePermission, usePermissions } from '@/hooks';
import { useTranslations } from 'next-intl';
import {
  inferRoleFromPermissions,
  PERMISSION_GROUPS,
} from '@/constants/rbac.const';
import {
  House,
  Newspaper,
  Bell,
  Settings,
  TriangleAlert,
  Building2,
  Vote,
  BarChart3,
} from 'lucide-react';

interface CityLayoutShellProps {
  cityId: string;
  children: React.ReactNode;
}

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

const NAV_ITEMS = [
  { key: 'home', path: '', icon: <House size={18} /> },
  { key: 'news', path: '/news', icon: <Newspaper size={18} /> },
  { key: 'alerts', path: '/alerts', icon: <Bell size={18} /> },
  { key: 'surveys', path: '/surveys', icon: <Vote size={18} /> },
  {
    key: 'problem',
    path: '/city-requests',
    icon: <TriangleAlert size={18} />,
    accent: true,
  },
  { key: 'analytics', path: '/analytics', icon: <BarChart3 size={18} /> },
  {
    key: 'adminSettings',
    path: '/admin-settings',
    icon: <Settings size={18} />,
  },
];

export default function CityLayoutShell(props: CityLayoutShellProps) {
  const { cityId, children } = props;
  const t = useTranslations();
  const { can: canManageRoles } = usePermission(PERMISSION_GROUPS.ROLE.MANAGE, {
    cityId,
  });
  const { permissions, isBlocked } = usePermissions({ cityId });
  const { data: city, isLoading } = useCityById(cityId);
  const pathname = usePathname();
  const router = useRouter();
  const baseRoute = `/city/${cityId}`;
  const bannedRoute = `${baseRoute}/banned`;
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const myCityRole = inferRoleFromPermissions(permissions);
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => item.key !== 'adminSettings' || canManageRoles,
  );
  const isBannedPage = pathname === bannedRoute;

  useEffect(() => {
    if (isBlocked && !isBannedPage) {
      router.replace(bannedRoute);
    }
  }, [bannedRoute, isBannedPage, isBlocked, router]);

  if (isBlocked && !isBannedPage) {
    return <div className="min-h-[80vh] bg-white" />;
  }

  return (
    <div className="flex h-full min-h-[80vh] flex-1">
      <aside
        className="flex min-h-[80vh] flex-col overflow-hidden border-r border-[var(--secondary)]/20 bg-[var(--surface-1)] shadow-[inset_-1px_0_0_rgba(12,38,61,0.04)] transition-all duration-200"
        style={{ width, minWidth: width }}
      >
        <div
          className={`flex p-2 pt-3 ${collapsed ? 'justify-center' : 'justify-end'}`}
        >
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded p-1 text-[var(--primary-light)] transition-colors hover:bg-[var(--secondary)]/12 hover:text-[var(--primary)]"
            title={collapsed ? t('cityNav.expand') : t('cityNav.collapse')}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {!collapsed ? (
          <div className="px-3 pb-2">
            <div className="mb-1 flex items-center gap-2">
              <Building2 size={20} className="text-[var(--secondary)]" />
              <p className="truncate text-lg text-[var(--primary)]">
                {isLoading ? '...' : city?.name}
              </p>
            </div>
            {city?.region ? (
              <span className="inline-flex rounded-full bg-[var(--secondary)]/12 px-2 py-0.5 text-xs text-[var(--secondary-dark)]">
                {city.region}
              </span>
            ) : null}
            {myCityRole ? (
              <div>
                <span className="mt-1 inline-flex rounded-full bg-[var(--success)]/14 px-2 py-0.5 text-xs text-[var(--success)]">
                  {`${t('cityLayout.myRole')}: ${t(`cityMembers.roles.${myCityRole}`)}`}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className="flex justify-center pb-2 text-xl text-[var(--secondary)]"
            title={city?.name}
          >
            <Building2 size={20} />
          </div>
        )}

        <div
          className={`${collapsed ? 'mx-1' : 'mx-2'} border-t border-black/10`}
        />

        <nav className={`flex-1 pt-2 ${collapsed ? 'px-1' : 'px-2'}`}>
          {visibleNavItems.map((item) => {
            const label = t(`cityNav.items.${item.key}`);
            const fullPath = `${baseRoute}${item.path}`;
            const isActive =
              item.path === ''
                ? pathname === baseRoute
                : pathname.startsWith(fullPath);

            const inactiveColor = item.accent
              ? 'text-[var(--danger-light)]'
              : 'text-[var(--primary-light)]';
            const activeBg = item.accent
              ? 'bg-[var(--danger)] text-white'
              : 'bg-[var(--secondary)]/14 text-[var(--secondary-dark)]';

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => router.push(fullPath)}
                title={collapsed ? label : undefined}
                className={`mb-1 flex w-full items-center rounded-lg px-2 py-2 text-left transition-colors ${
                  isActive
                    ? `${activeBg} shadow-sm`
                    : `${inactiveColor} hover:bg-[var(--secondary)]/10 hover:text-[var(--primary)]`
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span
                  className={`${collapsed ? '' : 'mr-2'} inline-flex w-6 justify-center`}
                >
                  {item.icon}
                </span>
                {!collapsed ? (
                  <span
                    className={`truncate text-sm ${isActive ? 'font-bold' : 'font-normal'}`}
                  >
                    {label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 bg-white p-4 md:p-6">{children}</main>
    </div>
  );
}
